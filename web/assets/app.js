/**
 * Mount an explicitly unfinished engineering shell.
 * Business routes and A/B theme settings belong to later Issues.
 *
 * @param {Document} documentRef
 */
export function mountShell(documentRef) {
  const outlet = documentRef.getElementById('app');
  if (!outlet) {
    throw new Error('Required application outlet #app is missing');
  }

  const main = documentRef.createElement('main');
  main.className = 'jq-shell';

  const title = documentRef.createElement('h1');
  title.textContent = '见趣';

  const description = documentRef.createElement('p');
  description.textContent = '工程骨架已建立，业务页面尚未接入。这里不是产品演示界面。';

  main.append(title, description);
  outlet.replaceChildren(main);
}

if (typeof document !== 'undefined') {
  mountShell(document);
}
