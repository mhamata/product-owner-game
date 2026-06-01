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
  return <SimRunner scenarioId={scenarioId} />;
}
