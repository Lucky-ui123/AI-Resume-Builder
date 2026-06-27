import { redirect } from 'next/navigation';

export default function SuggestionsRedirectPage() {
  redirect('/dashboard/builder');
}
