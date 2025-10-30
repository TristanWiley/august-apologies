export const generateJSONResponse = (json: any, status: number): Response => {
  // If the status is an error, log the error
  if (status >= 400) {
    console.error(json);
  }

  return new Response(JSON.stringify(json), {
    headers: {
      "content-type": "application/json;charset=UTF-8",
    },
    status,
  });
};
