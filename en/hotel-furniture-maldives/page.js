'use strict';
const form = document.querySelector('#project-form');
const track = (channel) => {
  if (typeof window.gtag === 'function') window.gtag('event', 'maldives_contact_intent', {channel});
};
document.querySelectorAll('[data-contact]').forEach(link => link.addEventListener('click', () => track(link.dataset.contact)));
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  const fields = [['Name','name'],['Company / property','company'],['Email','email'],['Island / location','location'],['Project type','type'],['Service required','scope'],['Rooms / quantities','quantity'],['Furniture budget (USD)','budget'],['Target delivery date','date'],['Requirements','message']];
  const body = 'Hello China Direct,\n\nI would like to discuss a furniture project in the Maldives.\n\n' + fields.map(([label,key]) => label + ': ' + (data.get(key) || 'Not specified')).join('\n') + '\n\nI will attach any available drawings, furniture schedules or reference images.';
  const href = 'mailto:info@chinadirect.pro?subject=' + encodeURIComponent('Maldives furniture project enquiry') + '&body=' + encodeURIComponent(body);
  const status = document.querySelector('#form-status');
  status.replaceChildren(document.createTextNode('Your enquiry is ready. If your email app did not open, '));
  const retry = document.createElement('a');
  retry.href = href;
  retry.textContent = 'open the prepared email';
  status.append(retry, document.createTextNode(' or contact info@chinadirect.pro directly. Your enquiry has not been sent by this website.'));
  status.hidden = false;
  track('email_prepared');
  window.location.href = href;
});
