import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { google } from "googleapis";
import * as fs from "fs";
import * as path from "path";

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get active Google Drive account that is not full
   */
  async getAvailableDrive() {
    const drive = await this.prisma.googleDrive.findFirst({
      where: {
        isActive: true,
        isFull: false,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!drive) {
      throw new BadRequestException(
        "No available Google Drive account. Please contact administrator."
      );
    }

    return drive;
  }

  /**
   * Get all active Google Drive accounts
   */
  async getAllActiveDrives() {
    return this.prisma.googleDrive.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });
  }

  /**
   * Get Google Drive account by ID
   */
  async getDriveById(id: string) {
    return this.prisma.googleDrive.findUnique({
      where: { id },
    });
  }

  /**
   * Initialize Google Drive client
   * Supports both Service Account and OAuth 2.0 credentials
   */
  private async getDriveClient(driveAccount: any) {
    if (!driveAccount.credentials) {
      throw new BadRequestException(
        `Google Drive account ${driveAccount.email} has no credentials configured.`
      );
    }

    let credentials;
    try {
      credentials = JSON.parse(driveAccount.credentials);
    } catch (error) {
      throw new BadRequestException(
        `Invalid credentials format for Google Drive account ${driveAccount.email}.`
      );
    }

    // Check credential type
    const isOAuth2 = credentials.type === 'oauth2';
    const isServiceAccount = credentials.type === 'service_account';

    if (!isOAuth2 && !isServiceAccount) {
      throw new BadRequestException(
        `Invalid credential type for Google Drive account ${driveAccount.email}. ` +
        `Expected 'service_account' or 'oauth2', got '${credentials.type}'.`
      );
    }

    let auth;
    
    if (isOAuth2) {
      // OAuth 2.0 credentials
      if (!credentials.client_id || !credentials.client_secret || !credentials.refresh_token) {
        throw new BadRequestException(
          `OAuth 2.0 credentials for ${driveAccount.email} are incomplete. ` +
          `Required: client_id, client_secret, refresh_token.`
        );
      }

      const oauth2Client = new google.auth.OAuth2(
        credentials.client_id,
        credentials.client_secret,
        credentials.redirect_uri || 'http://localhost:3000/api/auth/google/callback'
      );

      oauth2Client.setCredentials({
        refresh_token: credentials.refresh_token,
      });

      // Refresh access token if needed
      try {
        const { credentials: tokenData } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(tokenData);
      } catch (refreshError: any) {
        this.logger.error(
          `Failed to refresh OAuth token for ${driveAccount.email}:`,
          refreshError
        );
        throw new BadRequestException(
          `Failed to refresh OAuth token. Please re-authorize and update refresh_token. ` +
          `Error: ${refreshError?.message || String(refreshError)}`
        );
      }

      auth = oauth2Client;
    } else {
      // Service Account credentials
      if (!credentials.client_email || !credentials.private_key) {
        throw new BadRequestException(
          `Service account credentials for ${driveAccount.email} are incomplete. ` +
          `Required: client_email, private_key.`
        );
      }

      auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          "https://www.googleapis.com/auth/drive.file",
          "https://www.googleapis.com/auth/drive.metadata",
        ],
      });
    }

    const drive = google.drive({ version: "v3", auth });
    return drive;
  }

  /**
   * Check if drive is full
   * Note: Service Accounts do not have storage quota.
   * For service accounts, we skip the check and return not full.
   * For Shared Drives, we can check the shared drive quota if needed.
   */
  async checkDriveSpace(driveAccount: any): Promise<{
    isFull: boolean;
    totalSpace: bigint;
    usedSpace: bigint;
    availableSpace: bigint;
  }> {
    // Detect service account by email pattern (ends with .iam.gserviceaccount.com)
    // Skip space check entirely for service accounts to avoid API errors
    const email = driveAccount.email?.toLowerCase() || '';
    const isServiceAccount = 
      email.endsWith('.iam.gserviceaccount.com') ||
      email.includes('@') && email.includes('gserviceaccount.com');
    
    if (isServiceAccount) {
      this.logger.log(
        `Service account ${driveAccount.email} detected by email pattern. Skipping storage quota check (service accounts don't have storage quota).`
      );
      // For service accounts, assume not full (they use shared drive or user folder quota)
      // Don't update isFull flag for service accounts
      return {
        isFull: false,
        totalSpace: BigInt(0),
        usedSpace: BigInt(0),
        availableSpace: BigInt(Number.MAX_SAFE_INTEGER), // Assume unlimited
      };
    }

    try {
      const drive = await this.getDriveClient(driveAccount);
      
      // For service accounts, don't call about.get() at all to avoid the error
      // Only call it for regular user accounts
      // But wrap in try-catch in case email pattern detection failed
      let about;
      try {
        about = await drive.about.get({ fields: "storageQuota,user" });
      } catch (apiError: any) {
        // If API throws error about storage quota, it's definitely a service account
        const errorMsg = 
          apiError?.message || 
          apiError?.response?.data?.error?.message || 
          apiError?.errors?.[0]?.message ||
          String(apiError);
        
        if (
          errorMsg.includes("storage quota") ||
          errorMsg.includes("Service Accounts do not have storage quota") ||
          errorMsg.includes("do not have storage quota") ||
          errorMsg.includes("Leverage shared drives") ||
          errorMsg.includes("OAuth delegation")
        ) {
          this.logger.warn(
            `Service account ${driveAccount.email} detected via API error. Skipping space check. Error: ${errorMsg}`
          );
          return {
            isFull: false,
            totalSpace: BigInt(0),
            usedSpace: BigInt(0),
            availableSpace: BigInt(Number.MAX_SAFE_INTEGER),
          };
        }
        throw apiError; // Re-throw if it's a different error
      }

      const quota = about.data.storageQuota;
      
      // If no quota info, likely a service account - skip check
      if (!quota || !quota.limit) {
        this.logger.warn(
          `No storage quota found for ${driveAccount.email}. Skipping space check.`
        );
        return {
          isFull: false,
          totalSpace: BigInt(0),
          usedSpace: BigInt(0),
          availableSpace: BigInt(Number.MAX_SAFE_INTEGER),
        };
      }

      const limit = BigInt(quota.limit);
      const usage = quota?.usage ? BigInt(quota.usage) : BigInt(0);
      const available = limit - usage;

      // Consider drive full if less than 100MB available
      const MINIMUM_SPACE = BigInt(100 * 1024 * 1024); // 100MB
      const isFull = available < MINIMUM_SPACE;

      // Update drive status in database
      await this.prisma.googleDrive.update({
        where: { id: driveAccount.id },
        data: {
          isFull,
          totalSpace: limit,
          usedSpace: usage,
        },
      });

      return {
        isFull,
        totalSpace: limit,
        usedSpace: usage,
        availableSpace: available,
      };
    } catch (error: any) {
      // Handle specific error for service accounts
      // Check multiple possible error message formats and error codes
      const errorMessage = 
        error?.message || 
        error?.response?.data?.error?.message || 
        error?.errors?.[0]?.message ||
        String(error);
      const errorCode = error?.code || error?.response?.data?.error?.code;
      
      const isServiceAccountError = 
        errorMessage.includes("storage quota") ||
        errorMessage.includes("Service Accounts do not have storage quota") ||
        errorMessage.includes("do not have storage quota") ||
        errorMessage.includes("Leverage shared drives") ||
        errorCode === 403; // Forbidden - often means service account
      
      if (isServiceAccountError) {
        this.logger.warn(
          `Service account ${driveAccount.email} does not have storage quota. Skipping space check.`
        );
        // For service accounts, assume not full
        return {
          isFull: false,
          totalSpace: BigInt(0),
          usedSpace: BigInt(0),
          availableSpace: BigInt(Number.MAX_SAFE_INTEGER),
        };
      }

      this.logger.error(
        `Error checking drive space for ${driveAccount.email}:`,
        error
      );
      // If check fails for other reasons, don't update isFull
      // Keep current status to avoid marking drive as full incorrectly
      throw error;
    }
  }

  /**
   * Upload file to Google Drive
   */
  async uploadFile(
    file: Express.Multer.File,
    driveAccount: any,
    folderId?: string
  ): Promise<{
    fileId: string;
    downloadUrl: string;
    thumbnailUrl?: string;
  }> {
    try {
      // Detect service account or OAuth2
      let credentials;
      try {
        credentials = JSON.parse(driveAccount.credentials || '{}');
      } catch {
        credentials = {};
      }
      
      const isOAuth2 = credentials.type === 'oauth2';
      const email = driveAccount.email?.toLowerCase() || '';
      const isServiceAccount = 
        credentials.type === 'service_account' ||
        email.endsWith('.iam.gserviceaccount.com') ||
        (email.includes('@') && email.includes('gserviceaccount.com'));
      
      // OAuth2 accounts can upload to My Drive folders, so they don't need folderId check
      // Service accounts need Shared Drive or shared folder (but My Drive folders don't work)
      
      // Only check drive space for non-service accounts
      if (!isServiceAccount) {
        try {
          const spaceInfo = await this.checkDriveSpace(driveAccount);
          if (spaceInfo.isFull) {
            // Try to find another available drive
            const alternativeDrive = await this.prisma.googleDrive.findFirst({
              where: {
                isActive: true,
                isFull: false,
                id: { not: driveAccount.id },
              },
              orderBy: {
                createdAt: "asc",
              },
            });

            if (alternativeDrive) {
              this.logger.warn(
                `Drive ${driveAccount.email} is full. Switching to ${alternativeDrive.email}`
              );
              return this.uploadFile(file, alternativeDrive, folderId);
            } else {
              throw new BadRequestException(
                "All Google Drive accounts are full. Please contact administrator."
              );
            }
          }
        } catch (spaceError: any) {
          // For non-service accounts, if check fails, log warning but continue
          this.logger.warn(
            `Could not check drive space for ${driveAccount.email}, proceeding with upload:`,
            spaceError
          );
          // If drive is marked as full in DB but check failed, try to proceed anyway
          if (driveAccount.isFull) {
            this.logger.warn(
              `Drive ${driveAccount.email} is marked as full but space check failed. Attempting upload anyway.`
            );
          }
        }
      } else {
        // Service account - skip space check completely
        this.logger.log(
          `Service account ${driveAccount.email} detected. Skipping space check and proceeding with upload.`
        );
      }

      const drive = await this.getDriveClient(driveAccount);
      
      // For service accounts, folderId is REQUIRED (they can't upload to root)
      // For OAuth2, folderId is optional (can upload to root or specific folder)
      const targetFolderId = folderId || driveAccount.folderId;
      
      this.logger.log(
        `Upload attempt - Type: ${isOAuth2 ? 'OAuth2' : isServiceAccount ? 'Service Account' : 'Unknown'}, ` +
        `Email: ${driveAccount.email}, ` +
        `FolderId from param: ${folderId || 'none'}, ` +
        `FolderId from DB: ${driveAccount.folderId || 'none'}, ` +
        `Target FolderId: ${targetFolderId || 'none'}`
      );
      
      if (isServiceAccount && !targetFolderId) {
        this.logger.error(
          `Service account ${driveAccount.email} attempted upload without folderId. ` +
          `Current folderId in database: ${driveAccount.folderId || 'null'}`
        );
        throw new BadRequestException(
          `Service account ${driveAccount.email} requires a folderId to upload files. ` +
          `Service accounts cannot upload to My Drive root. ` +
          `Please use a Shared Drive or switch to OAuth 2.0. ` +
          `Current folderId: ${driveAccount.folderId || 'not set'}. ` +
          `See SHARE_FOLDER_WITH_SERVICE_ACCOUNT.md or OAUTH_SETUP.md for instructions.`
        );
      }
      
      // For service accounts, we MUST set parents in fileMetadata
      // Without parents, Google will try to upload to service account root, which causes quota error
      const fileMetadata: any = {
        name: file.originalname,
      };

      // Always set parents for service accounts, optional for regular users
      if (targetFolderId) {
        // CRITICAL: parents must be an array of folder IDs
        fileMetadata.parents = [targetFolderId];
        this.logger.log(
          `Uploading file "${file.originalname}" (${(file.size / 1024 / 1024).toFixed(2)} MB) ` +
          `to folder: ${targetFolderId} for ${driveAccount.email}. ` +
          `FileMetadata: ${JSON.stringify({ name: fileMetadata.name, parents: fileMetadata.parents })}`
        );
      } else if (isServiceAccount) {
        // This should not happen due to check above, but just in case
        throw new BadRequestException(
          `Service account ${driveAccount.email} must have a folderId set to upload files.`
        );
      } else {
        this.logger.warn(
          `No folderId specified for non-service account ${driveAccount.email}. Uploading to root.`
        );
      }

      const media = {
        mimeType: file.mimetype,
        body: fs.createReadStream(file.path),
      };

      // For service accounts, verify folder access before uploading
      if (isServiceAccount && targetFolderId) {
        try {
          // Try to get folder info to verify access
          await drive.files.get({
            fileId: targetFolderId,
            fields: "id, name, permissions",
          });
          this.logger.log(
            `Folder ${targetFolderId} access verified for service account ${driveAccount.email}`
          );
        } catch (accessError: any) {
          const errorMsg = 
            accessError?.message || 
            accessError?.response?.data?.error?.message ||
            accessError?.errors?.[0]?.message ||
            String(accessError);
          
          if (accessError?.code === 404) {
            throw new BadRequestException(
              `Folder not found: ${targetFolderId}. ` +
              `Please check: 1) Folder ID is correct, 2) Folder exists in Google Drive, 3) folderId in database is correct.`
            );
          } else if (accessError?.code === 403) {
            throw new BadRequestException(
              `Service account ${driveAccount.email} does not have access to folder ${targetFolderId}. ` +
              `Please check: 1) Folder is shared with ${driveAccount.email} (NOT "Anyone with the link"), ` +
              `2) Permission is Editor or Content Manager, 3) Service account email is in "People with access" list.`
            );
          }
          // If other error, continue to try upload anyway
          this.logger.warn(
            `Could not verify folder access, but proceeding with upload: ${errorMsg}`
          );
        }
      }

      let uploadedFile;
      try {
        // Log full requestBody to debug
        this.logger.log(
          `Calling drive.files.create. ` +
          `RequestBody: ${JSON.stringify(fileMetadata)}, ` +
          `Parents: ${fileMetadata.parents ? fileMetadata.parents.join(', ') : 'none'}, ` +
          `IsServiceAccount: ${isServiceAccount}`
        );
        
        // For service accounts, ensure supportsAllDrives is set
        const uploadOptions: any = {
          requestBody: fileMetadata,
          media,
          fields: "id, webViewLink, thumbnailLink",
        };
        
        // Add supportsAllDrives for shared drives (if applicable)
        // This is important for service accounts uploading to shared folders
        if (isServiceAccount && targetFolderId) {
          uploadOptions.supportsAllDrives = true;
          uploadOptions.supportsTeamDrives = true;
        }
        
        // Double-check parents is set correctly before upload
        if (isServiceAccount && targetFolderId && !fileMetadata.parents) {
          this.logger.error(
            `CRITICAL: parents not set in fileMetadata for service account! ` +
            `targetFolderId: ${targetFolderId}, fileMetadata: ${JSON.stringify(fileMetadata)}`
          );
          fileMetadata.parents = [targetFolderId];
          uploadOptions.requestBody = fileMetadata; // Update requestBody
        }
        
        // Final verification: log the exact requestBody being sent
        this.logger.log(
          `Final upload requestBody: ${JSON.stringify(uploadOptions.requestBody)}`
        );
        
        uploadedFile = await drive.files.create(uploadOptions);
        this.logger.log(
          `File uploaded successfully. File ID: ${uploadedFile.data.id}, WebViewLink: ${uploadedFile.data.webViewLink}`
        );
      } catch (uploadError: any) {
        // Handle service account quota error more gracefully
        const errorMsg = 
          uploadError?.message || 
          uploadError?.response?.data?.error?.message ||
          uploadError?.errors?.[0]?.message ||
          String(uploadError);
        
        if (
          errorMsg.includes("storage quota") ||
          errorMsg.includes("Service Accounts do not have storage quota") ||
          (uploadError?.code === 403 && errorMsg.includes("storage"))
        ) {
          this.logger.error(
            `Service account upload failed. FolderId: ${targetFolderId || 'not set'}. ` +
            `Error: ${errorMsg}. ` +
            `Please ensure: 1) Folder is shared DIRECTLY with service account email (NOT "Anyone with the link"), ` +
            `2) Service account has Editor/Content Manager permission, 3) folderId is correct.`
          );
          throw new BadRequestException(
            `Cannot upload to Google Drive: Service account requires a shared folder with proper permissions. ` +
            `FolderId: ${targetFolderId || 'not set'}. ` +
            `Please check: 1) Folder ${targetFolderId || 'N/A'} is shared DIRECTLY with ${driveAccount.email} (NOT "Anyone with the link"), ` +
            `2) Permission is Editor or Content Manager, 3) Service account email appears in "People with access" list, ` +
            `4) folderId is correct in database.`
          );
        }
        
        // Handle permission denied errors
        if (uploadError?.code === 403) {
          throw new BadRequestException(
            `Permission denied: Service account ${driveAccount.email} cannot upload to folder ${targetFolderId}. ` +
            `Please check: 1) Folder is shared DIRECTLY with ${driveAccount.email}, ` +
            `2) Permission is Editor or Content Manager (not Viewer), ` +
            `3) Service account email is in "People with access" list.`
          );
        }
        
        throw uploadError;
      }

      // Make file publicly viewable (or use service account permissions)
      await drive.permissions.create({
        fileId: uploadedFile.data.id!,
        requestBody: {
          role: "reader",
          type: "anyone",
        },
      });

      // Clean up temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      const downloadUrl = `https://drive.google.com/uc?export=download&id=${uploadedFile.data.id}`;
      const webViewUrl = uploadedFile.data.webViewLink || downloadUrl;

      return {
        fileId: uploadedFile.data.id!,
        downloadUrl: webViewUrl,
        thumbnailUrl: uploadedFile.data.thumbnailLink || undefined,
      };
    } catch (error) {
      // Clean up temporary file on error
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      this.logger.error(`Error uploading file to Google Drive:`, error);
      throw error;
    }
  }

  /**
   * Delete file from Google Drive
   */
  async deleteFile(fileId: string, driveAccount: any): Promise<void> {
    try {
      const drive = await this.getDriveClient(driveAccount);
      await drive.files.delete({ fileId });
    } catch (error) {
      this.logger.error(`Error deleting file from Google Drive:`, error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  async getFileUrl(fileId: string, driveAccount: any): Promise<string> {
    try {
      const drive = await this.getDriveClient(driveAccount);
      const file = await drive.files.get({
        fileId,
        fields: "webViewLink",
      });

      return (
        file.data.webViewLink ||
        `https://drive.google.com/uc?export=download&id=${fileId}`
      );
    } catch (error) {
      this.logger.error(`Error getting file URL:`, error);
      throw error;
    }
  }

  /**
   * Re-check drive space and update status
   * Useful when drive was marked as full but space might have been freed
   * Note: For service accounts, this will return not full (they don't have quota)
   */
  async refreshDriveStatus(driveId: string) {
    const driveAccount = await this.prisma.googleDrive.findUnique({
      where: { id: driveId },
    });

    if (!driveAccount) {
      throw new BadRequestException("Google Drive account not found");
    }

    try {
      const spaceInfo = await this.checkDriveSpace(driveAccount);
      return {
        ...spaceInfo,
        email: driveAccount.email,
        name: driveAccount.name,
      };
    } catch (error: any) {
      // If error is about service account quota, return not full
      const errorMessage = 
        error?.message || 
        error?.response?.data?.error?.message || 
        error?.errors?.[0]?.message ||
        String(error);
      
      if (
        errorMessage.includes("storage quota") ||
        errorMessage.includes("Service Accounts do not have storage quota") ||
        errorMessage.includes("Leverage shared drives")
      ) {
        this.logger.log(
          `Service account ${driveAccount.email} detected. Returning not full status.`
        );
        return {
          isFull: false,
          totalSpace: BigInt(0),
          usedSpace: BigInt(0),
          availableSpace: BigInt(Number.MAX_SAFE_INTEGER),
          email: driveAccount.email,
          name: driveAccount.name,
        };
      }
      
      this.logger.error(
        `Error refreshing drive status for ${driveAccount.email}:`,
        error
      );
      // If check fails for other reasons, don't update isFull - keep current status
      throw error;
    }
  }

  /**
   * Manually reset isFull flag (use with caution)
   * Only use if you're sure the drive has space available
   */
  async resetFullFlag(driveId: string) {
    const driveAccount = await this.prisma.googleDrive.findUnique({
      where: { id: driveId },
    });

    if (!driveAccount) {
      throw new BadRequestException("Google Drive account not found");
    }

    return this.prisma.googleDrive.update({
      where: { id: driveId },
      data: {
        isFull: false,
      },
    });
  }
}

