import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AdminPanelPage = () => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl">⚙️ Panel administracyjny</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          Panel administracyjny będzie dostępny w Etapie 4.
        </p>
      </CardContent>
    </Card>
  );
};

export default AdminPanelPage;
