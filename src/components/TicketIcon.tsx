type Props = { className?: string };

export function TicketIcon({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.05a1.5 1.5 0 0 0 0-3H5.5A5.5 5.5 0 0 0 0 8.5v1A2.5 2.5 0 0 0 2.5 12 2.5 2.5 0 0 0 0 14.5v1A5.5 5.5 0 0 0 5.5 21h1.05a1.5 1.5 0 0 1 0-3H5.5A2.5 2.5 0 0 1 3 15.5v-7ZM19 8.5A2.5 2.5 0 0 0 16.5 6h-1.05a1.5 1.5 0 0 1 0-3H16.5A5.5 5.5 0 0 1 24 8.5v1A2.5 2.5 0 0 1 21.5 12 2.5 2.5 0 0 1 24 14.5v1a5.5 5.5 0 0 1-5.5 5.5h-1.05a1.5 1.5 0 0 0 0-3H16.5A2.5 2.5 0 0 0 19 15.5v-7ZM9 9h6v1.2H9V9Zm0 3.6h6V14H9v-1.4Z"
      />
    </svg>
  );
}
