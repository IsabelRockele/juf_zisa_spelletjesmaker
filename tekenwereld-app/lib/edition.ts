const requested = new URLSearchParams(location.search).get('editie');
export const edition = requested === 'pro' || requested === 'ontdek' ? requested : 'gratis';
export const toolsHref = edition === 'gratis' ? '../index.html#creatief' : `../${edition}/app.html`;
export const signInHref = edition === 'pro' ? '../pro/index.html' : edition === 'ontdek' ? '../ontdek/app.html' : '../login_collega.html';
export const startHref = './index.html' + (edition === 'gratis' ? '' : '?editie=' + edition);
