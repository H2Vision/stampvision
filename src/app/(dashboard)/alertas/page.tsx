import { AlertasList } from "@/components/alertas/alertas-list";

export default function AlertasPage() {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Centro de Alertas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Alertas automáticas basadas en umbrales de OEE, scrap y tiempo muerto
        </p>
      </div>
      <AlertasList />
    </div>
  );
}
