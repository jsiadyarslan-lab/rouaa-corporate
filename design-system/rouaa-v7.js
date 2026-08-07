(function(){"use strict";
var RM=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Nav + progress */
var nav=document.querySelector('nav'),prog=document.getElementById('prog');
if(nav||prog){addEventListener('scroll',function(){var h=document.documentElement;
 if(prog)prog.style.width=(h.scrollTop/((h.scrollHeight-h.clientHeight)||1)*100)+'%';
 if(nav)nav.classList.toggle('scd',scrollY>10);},{passive:true});}
/* Dropdowns */
document.querySelectorAll('.nav-dropdown-trigger').forEach(function(btn){
 btn.addEventListener('click',function(e){e.stopPropagation();
  var item=btn.closest('.nav-item-has-dropdown');
  document.querySelectorAll('.nav-item-has-dropdown.open').forEach(function(o){if(o!==item)o.classList.remove('open');});
  item.classList.toggle('open');btn.setAttribute('aria-expanded',item.classList.contains('open'));});});
document.addEventListener('click',function(){document.querySelectorAll('.nav-item-has-dropdown.open').forEach(function(o){o.classList.remove('open');});});
/* Reveal + شبكة أمان */
var rv=document.querySelectorAll('.rv');
if(rv.length){
 if(RM||!('IntersectionObserver'in window)){rv.forEach(function(el){el.classList.add('in');});}
 else{
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});},{threshold:.15});
  rv.forEach(function(el){io.observe(el);});
  var vis=function(){rv.forEach(function(el){if(el.classList.contains('in'))return;var r=el.getBoundingClientRect();if(r.top<(innerHeight||document.documentElement.clientHeight)+150)el.classList.add('in');});};
  addEventListener('load',vis);setTimeout(vis,900);
 }
}
/* Stagger */
document.querySelectorAll('[data-stag]').forEach(function(p){Array.prototype.forEach.call(p.children,function(c,i){c.style.transitionDelay=(i*90)+'ms';});});
})();
