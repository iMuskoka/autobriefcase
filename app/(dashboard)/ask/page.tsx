import { NLQueryBar } from "@/components/nl-query/NLQueryBar";

export default function AskPage() {
  return (
    <div className="flex flex-col gap-4 p-6 pb-20 lg:pb-0">
      <div>
        <h1 className="text-2xl font-heading font-bold">Ask</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Natural language search across your fleet.
        </p>
      </div>
      <NLQueryBar autoFocus fullWidth />
    </div>
  );
}
