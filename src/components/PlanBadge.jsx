export default function PlanBadge({ plan }) {
  return <span className={`badge badge-${plan.toLowerCase()}`}>{plan}</span>;
}
