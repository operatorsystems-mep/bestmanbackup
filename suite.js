/* Homepage purchase links. The homepage now ships real <a> buy links in static HTML (house UTM format below).
   This script only upgrades any leftover <button data-product> placeholder; a product without a live listing (ready:false) keeps no buy button. */
const BMB_RELEASE = Object.freeze({
  approved: true,
  products: {
    duties: {ready:true, url:'https://www.etsy.com/listing/4592141224'},
    playbook: {ready:true, url:'https://www.etsy.com/listing/4593059189'},
    speech: {ready:true, url:'https://www.etsy.com/listing/4567367337'},
    set: {ready:true, url:'https://www.etsy.com/listing/4593235340'}
  }
});
(() => {
  // GoatCounter is loaded by /analytics.js (production host only).
  if (!BMB_RELEASE.approved) return;
  document.querySelectorAll('[data-review-only]').forEach(node => node.remove());
  document.querySelectorAll('button[data-product]').forEach(button => {
    const key = button.dataset.product, product = BMB_RELEASE.products[key];
    if (!product?.ready || !/^https:\/\/www\.etsy\.com\/listing\/\d+$/.test(product.url)) { button.remove(); return; }
    const link=document.createElement('a');
    link.className=button.className; link.textContent=button.dataset.label;
    const url=new URL(product.url);
    url.search=new URLSearchParams({utm_source:'site',utm_medium:'buy',utm_campaign:key,utm_content:button.dataset.placement});
    link.href=url.href;link.target='_blank';link.rel='noopener';
    link.setAttribute('aria-label',button.dataset.label+' on Etsy (opens in a new tab)');
    link.dataset.goatcounterClick='etsy-'+key+'-'+button.dataset.placement;
    link.dataset.goatcounterTitle=button.dataset.label;
    button.replaceWith(link);
  });
})();
