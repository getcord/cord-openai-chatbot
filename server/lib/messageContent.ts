export function generateCordParagraph(msg: string) {
  return {
    type: 'p',
    children: [
      {
        text: msg,
      },
    ],
  };
}

export function convertCordMessageToPlainText(content: object[]) {
  const txtParts: string[] = [];
  messageToPlainText(content, txtParts);
  return txtParts.join('');
}

function messageToPlainText(msg: object[], text: string[]) {
  for (const part of msg) {
    if (hasOwnProperty(part, 'text') && typeof part.text === 'string') {
      text.push(part.text);
    }
    if (hasOwnProperty(part, 'children') && Array.isArray(part.children)) {
      messageToPlainText(part.children, text);
    }
  }
}

// This function determines if X has property Y and does so in a
// a way that preserves the type information within TypeScript.
function hasOwnProperty<X extends {}, Y extends PropertyKey>(
  obj: X,
  prop: Y,
): obj is X & Record<Y, unknown> {
  return obj.hasOwnProperty(prop);
}
