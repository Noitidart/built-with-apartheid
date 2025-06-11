export async function onRequest() {
  console.log('Cron job executed at:', new Date().toISOString());

  try {
    const response = await fetch(
      'http://localhost:3000/api/v1/trigger-monthly-email',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }
    );

    if (!response.ok) {
      console.error(`failed`);
    } else {
      console.log(`sent successfully`);
    }

    return new Response('Emails attempted successfully', { status: 200 });
  } catch (error) {
    console.error('Cron job error:', error);
    return new Response(`Failed with error: ${(error as Error).message}`, {
      status: 500
    });
  }
}

export const config = {
  //   schedule: '0 0 1 * *' // 1st of every month at midnight
  // schedule: '*/2 * * * *' // every 2 minutes
  schedule: '*/30 * * * *' // every 30 minutes
};
