import { NextResponse } from 'next/server';
import { checkAndIncrementExportUsage } from '@/lib/db-service';

export async function POST() {
  try {
    await checkAndIncrementExportUsage();
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if ((error as Error)?.message === 'EXPORT_LIMIT_REACHED') {
      return NextResponse.json(
        { error: 'EXPORT_LIMIT_REACHED' },
        { status: 403 }
      );
    }
    console.error('Error checking export limit:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
