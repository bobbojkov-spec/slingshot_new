import { listInquiriesWithItems } from '@/lib/inquiries';
import InquiriesClient from './InquiriesClient';

export const revalidate = 0;

export default async function InquiriesPage() {
  const inquiries = await listInquiriesWithItems(200);
  return <InquiriesClient inquiries={inquiries} />;
}