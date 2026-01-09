import ColorsAdminClient from './ColorsAdminClient';

export const revalidate = 0;

export default function ColorsPage() {
  return (
    <div style={{ width: '100%' }}>
      <ColorsAdminClient />
    </div>
  );
}

