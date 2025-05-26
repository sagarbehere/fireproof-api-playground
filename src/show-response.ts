// This function converts the responseObject argument to a string and displays it in the browser.
export function showResponse(message: string, responseObject: any): void {
  const responseDiv = document.getElementById('api-response') as HTMLDivElement;
  //console.log('Response Div:', responseDiv);
  if (responseDiv) {
    let formattedObject: string;
    
    try {
      //formattedObject = "Test string";
      formattedObject = JSON.stringify(responseObject, null, 2);
    } catch (error) {
      console.error('Error serializing object:', error);
      if (error instanceof TypeError && error.message.includes('circular structure')) {
        // Handle circular references by using a replacer function
        console.warn('Circular reference detected, using custom serialization');
        const seen = new WeakSet();
        formattedObject = JSON.stringify(responseObject, (_key, value) => {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
              return '[Circular Reference]';
            }
            seen.add(value);
          }
          return value;
        }, 2);
      } else {
        const errorMessage = (error instanceof Error) ? error.message : String(error);
        formattedObject = `[Error serializing object: ${errorMessage}]`;
      }
    }
    //console.log('Formatted object with circular reference handling:', formattedObject);
    responseDiv.innerHTML = `
      <p>${message}</p>
      <pre>${formattedObject}</pre>
    `;
  } else {
    console.error('Element with id "api-response" not found');
  }
}