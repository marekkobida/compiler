export let S: { date: number, message: string, type: string, }[] = [];

function test (message: any, type: 'error' | 'information' | 'warning') {
  S = [
    {
      date: +new Date(), message: JSON.stringify(message, null, 2), type,
    },
    ...S,
  ];
}

export default test;
