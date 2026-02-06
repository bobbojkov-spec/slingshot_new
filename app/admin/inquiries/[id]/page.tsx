import InquiryDetailClient from './InquiryDetailClient';

type Props = {
  params: { id: string };
};

export const revalidate = 0;

export default function InquiryDetailPage({ params }: Props) {
  return <InquiryDetailClient inquiryId={params.id} />;
}