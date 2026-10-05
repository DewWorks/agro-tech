export { Skeleton } from './skeletons'
export default function DefaultSkeleton(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800 ${props.className || ''}`} />
}
