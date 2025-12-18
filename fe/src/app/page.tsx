import dynamic from "next/dynamic";

const Dashboard = dynamic(() => import("@/components/dashboard/Dashboard").then(mod => ({ default: mod.Dashboard })), {
  ssr: false,
});

export default function HomePage() {
  return <Dashboard />;
}
