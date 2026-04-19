import { GameView } from '@/components/GameView';

export default async function PlayPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  return <GameView scenarioId={scenarioId} />;
}
