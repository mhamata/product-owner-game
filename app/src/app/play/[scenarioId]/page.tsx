import { notFound } from 'next/navigation';
import { getScenario } from '@/scenarios';
import { SimRunner } from '@/components/console/sim/SimRunner';

// The /play capstone now renders the Guided Flow simulation (a linear sprint
// stepper) instead of the old 3-column GameView. The server component awaits the
// dynamic param (Next 16 async params) and hands the scenario id to the client
// runner, which owns hydration + the engine-driven stepper.
export default async function PlayPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  // 404 on unknown/removed scenarios (e.g. the excluded scenario02) instead of
  // rendering a broken sim full of "undefined".
  if (!getScenario(scenarioId)) notFound();
  return <SimRunner scenarioId={scenarioId} />;
}
