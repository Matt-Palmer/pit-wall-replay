import './skeleton.css';

type SkeletonProps = {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
};

export function Skeleton({ width = '100%', height = '1em', radius = 4, className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={className ? `skeleton ${className}` : 'skeleton'}
      style={{ width, height, borderRadius: radius }}
    />
  );
}
