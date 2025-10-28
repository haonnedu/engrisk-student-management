"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useMyProfile, useUpdateMyProfile } from "@/hooks/useParent";
import { useTranslations } from "@/hooks/useTranslations";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Calendar, Mail, Phone, MapPin, User, School } from "lucide-react";

export default function ParentProfilePage() {
  const { data: profile, isLoading, error } = useMyProfile();
  const updateProfileMutation = useUpdateMyProfile();
  const { t } = useTranslations('parent.profile');

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    emergencyContact: "",
    classSchool: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        address: profile.address || "",
        emergencyContact: profile.emergencyContact || "",
        classSchool: profile.classSchool || "",
      });
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    updateProfileMutation.mutate(formData, {
      onSuccess: () => {
        toast.success(t('updateSuccess'));
        setIsEditing(false);
      },
      onError: (error: any) => {
        const errorMessage = error.message || 
                           error.response?.data?.message || 
                           t('updateFailed');
        toast.error(errorMessage);
      },
    });
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        address: profile.address || "",
        emergencyContact: profile.emergencyContact || "",
        classSchool: profile.classSchool || "",
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error) {
    const errorMessage = (error as any).message || 
                        (error as any).response?.data?.message || 
                        t('errorMessage');
    return (
      <div className="flex h-64 flex-col items-center justify-center text-red-500 gap-2">
        <p className="font-semibold">{t('errorLoading')}</p>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        {t('noProfileData')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">
            {t('description')}
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            {t('editProfile')}
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Basic Information Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{t('personalInfo')}</CardTitle>
            <CardDescription>
              {t('personalInfoDesc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">{t('firstName')}</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      placeholder={t('firstName')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">{t('lastName')}</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      placeholder={t('lastName')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="engName">{t('englishName')}</Label>
                  <Input
                    id="engName"
                    value={profile.engName}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('cannotBeChanged')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t('phoneNumber')}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone || ""}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('cannotBeChanged')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder={t('addressPlaceholder')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyContact">{t('emergencyContact')}</Label>
                  <Input
                    id="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: e.target.value,
                      })
                    }
                    placeholder={t('emergencyContactPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="classSchool">{t('classSchool')}</Label>
                  <Input
                    id="classSchool"
                    value={formData.classSchool}
                    onChange={(e) =>
                      setFormData({ ...formData, classSchool: e.target.value })
                    }
                    placeholder={t('classSchoolPlaceholder')}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        {t('saving')}
                      </>
                    ) : (
                      t('saveChanges')
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                  >
                    {t('cancel')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{t('firstName')}</span>
                    </div>
                    <p className="font-medium">{profile.firstName}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{t('lastName')}</span>
                    </div>
                    <p className="font-medium">{profile.lastName}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{t('englishName')}</span>
                  </div>
                  <p className="font-medium">{profile.engName}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{t('phoneNumber')}</span>
                  </div>
                  <p className="font-medium">{profile.phone || "-"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{t('email')}</span>
                  </div>
                  <p className="font-medium">{profile.user?.email || "-"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{t('address')}</span>
                  </div>
                  <p className="font-medium">{profile.address || "-"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>{t('emergencyContact')}</span>
                  </div>
                  <p className="font-medium">{profile.emergencyContact || "-"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <School className="h-4 w-4" />
                    <span>{t('classSchool')}</span>
                  </div>
                  <p className="font-medium">{profile.classSchool || "-"}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{t('dateOfBirth')}</span>
                  </div>
                  <p className="font-medium">
                    {new Date(profile.dateOfBirth).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('accountStatus')}</CardTitle>
            <CardDescription>{t('accountInfo')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('studentId')}</p>
              <p className="font-mono font-medium">{profile.studentId}</p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('status')}</p>
              <Badge
                variant={profile.status === "ACTIVE" ? "default" : "secondary"}
              >
                {profile.status === "ACTIVE" ? t('active') : t('inactive')}
              </Badge>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('enrolledSince')}</p>
              <p className="text-sm">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{t('totalEnrollments')}</p>
              <p className="text-2xl font-bold">
                {profile.enrollments?.length || 0}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrollments Card */}
      {profile.enrollments && profile.enrollments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('myEnrollments')}</CardTitle>
            <CardDescription>{t('coursesEnrolled')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {profile.enrollments.map((enrollment) => (
                <Card key={enrollment.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {enrollment.course.title}
                    </CardTitle>
                    <CardDescription>{enrollment.course.courseCode}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {enrollment.section && (
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">{t('section')}</p>
                        <p className="font-medium">{enrollment.section.name}</p>
                        <Badge variant="outline">{enrollment.section.code}</Badge>
                      </div>
                    )}
                    <div className="mt-3">
                      <Badge
                        variant={
                          enrollment.status === "ENROLLED"
                            ? "default"
                            : enrollment.status === "COMPLETED"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {enrollment.status === "ENROLLED" ? t('enrolled') : 
                         enrollment.status === "COMPLETED" ? t('completed') : 
                         t('dropped')}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

