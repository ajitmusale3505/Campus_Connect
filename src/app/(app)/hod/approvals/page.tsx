import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ApprovalsPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Leave Approvals</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>A list of pending leave requests from faculty will be displayed here.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
