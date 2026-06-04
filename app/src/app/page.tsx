import { PracticeMap } from '@/components/console/PracticeMap';

/**
 * Home = the Console "Practice Map" (curriculum), replacing the old scenario
 * picker. The legacy simulation is still reachable as a "Capstone" link inside
 * the map, and the /play and /methods routes are untouched.
 */
export default function Home() {
  return <PracticeMap />;
}
