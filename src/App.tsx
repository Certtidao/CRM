import { BrowserRouter } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter basename="/CRM">
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <h1 className="text-2xl font-semibold">CRM Certtidão</h1>
      </div>
    </BrowserRouter>
  );
}
