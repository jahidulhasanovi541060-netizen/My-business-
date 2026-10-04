
const KEY='kola_full_v12';
let db=loadDB();
function loadDB(){
 try{let x=JSON.parse(localStorage.getItem(KEY)||''); if(x&&x.customers&&x.days)return x}catch(e){}
 return {version:14,customers:[],days:{},activities:[]};
}
function save(){localStorage.setItem(KEY,JSON.stringify(db)); renderAll()}
function today(){return new Date().toISOString().slice(0,10)}
function money(n){return '৳'+Number(n||0).toLocaleString('en-US',{maximumFractionDigits:2})}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function fmtDate(d){if(!d)return '';let [y,m,dd]=d.split('-');return `${dd}/${m}/${y}`}
function monthNow(){return today().slice(0,7)}
function day(d=today()){if(!db.days[d])db.days[d]={cash:0,credit:0,purchase:0,rent:0,other:0,collections:0,sales:[]}; if(!db.days[d].sales)db.days[d].sales=[]; return db.days[d]}
function addActivity(type,text,amount,d=today()){db.activities.unshift({time:new Date().toISOString(),date:d,type,text,amount:Number(amount||0)});db.activities=db.activities.slice(0,100)}
function toast(t){let x=document.getElementById('toast');x.textContent=t;x.classList.add('show');setTimeout(()=>x.classList.remove('show'),1800)}
function go(id){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById(id).classList.add('active');document.querySelectorAll('.bottom button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));renderAll();scrollTo(0,0)}
function openModal(id){document.getElementById(id).classList.add('show')}
function closeModal(){document.querySelectorAll('.modal').forEach(x=>x.classList.remove('show'))}
function openSheet(html){document.getElementById('sheet').innerHTML=html;document.getElementById('modal').classList.add('show')}

function openSale(kind){
 let cust=db.customers[0];
 openSheet(`<button class="close" onclick="closeModal()">✕</button><h2>${kind==='cash'?'নগদ বিক্রি':'বাকি বিক্রি'}</h2>
 ${kind==='credit'?`<label>কাস্টমার</label><select id="fCust">${db.customers.map(c=>`<option value="${c.id}">${esc(c.name)}${c.phone?' — '+esc(c.phone):''}</option>`).join('')}</select>`:''}
 <label>তারিখ</label><input id="fDate" type="date" value="${today()}">
 <label>বিক্রির পরিমাণ</label><input id="fAmount" type="number" min="0" step="0.01" placeholder="৳">
 <label>নোট</label><textarea id="fNote" placeholder="প্রয়োজনে লিখুন"></textarea>
 <button class="btn" style="width:100%;margin-top:12px" onclick="saveSale('${kind}')">সংরক্ষণ</button>`);
 if(kind==='credit'&&!db.customers.length)toast('আগে একজন কাস্টমার যোগ করুন');
}
function saveSale(kind){
 let d=document.getElementById('fDate').value||today(),a=+document.getElementById('fAmount').value||0,n=document.getElementById('fNote').value;
 if(a<=0)return toast('সঠিক পরিমাণ দিন');
 let x=day(d);x.sales.push({id:Date.now(),kind,amount:a,note:n});
 if(kind==='cash')x.cash+=a; else {x.credit+=a;let c=db.customers.find(c=>c.id==document.getElementById('fCust').value);if(!c)return toast('কাস্টমার নির্বাচন করুন');c.due=(c.due||0)+a;c.history=c.history||[];c.history.push({date:d,type:'credit',amount:a,note:n})}
 addActivity(kind==='cash'?'বিক্রি':'বাকি বিক্রি',kind==='cash'?'নগদ বিক্রি':'বাকি বিক্রি',a,d);closeModal();save();toast('হিসাব সংরক্ষণ হয়েছে');
}
function openExpense(){
 openSheet(`<button class="close" onclick="closeModal()">✕</button><h2>খরচ যোগ করুন</h2><label>তারিখ</label><input id="eDate" type="date" value="${today()}"><label>খরচের ধরন</label><select id="eType"><option value="purchase">কলা/পণ্য ক্রয়</option><option value="rent">পরিবহন / ভাড়া</option><option value="other">অন্যান্য খরচ</option></select><label>পরিমাণ</label><input id="eAmount" type="number" min="0" step=".01"><label>নোট</label><textarea id="eNote"></textarea><button class="btn" style="width:100%;margin-top:12px" onclick="saveExpense()">সংরক্ষণ</button>`);
}
function openPurchase(){openExpense()}
function saveExpense(){
 let d=document.getElementById('eDate').value||today(),a=+document.getElementById('eAmount').value||0,t=document.getElementById('eType').value,n=document.getElementById('eNote').value;if(a<=0)return toast('সঠিক পরিমাণ দিন');let x=day(d);x[t]=(x[t]||0)+a;addActivity(t==='purchase'?'পণ্য ক্রয়':t==='rent'?'ভাড়া/পরিবহন':'অন্যান্য খরচ',n||'খরচ',a,d);closeModal();save();toast('খরচ যোগ হয়েছে')}
function openCustomer(editId=null){
 let c=editId?db.customers.find(x=>x.id==editId):null;
 openSheet(`<button class="close" onclick="closeModal()">✕</button><h2>${c?'কাস্টমার সম্পাদনা':'নতুন কাস্টমার'}</h2><label>নাম</label><input id="cName" value="${esc(c?.name||'')}"><label>মোবাইল</label><input id="cPhone" value="${esc(c?.phone||'')}"><label>শুরুর বাকি</label><input id="cDue" type="number" value="${c?.due||0}" ${c?'disabled':''}><label>নোট</label><textarea id="cNote">${esc(c?.note||'')}</textarea><button class="btn" style="width:100%;margin-top:12px" onclick="saveCustomer(${editId||0})">সংরক্ষণ</button>`);
}
function saveCustomer(id){
 let name=document.getElementById('cName').value.trim(),phone=document.getElementById('cPhone').value.trim(),note=document.getElementById('cNote').value;if(!name)return toast('নাম দিন');
 if(id){let c=db.customers.find(x=>x.id==id);Object.assign(c,{name,phone,note})}else{let due=+document.getElementById('cDue').value||0;db.customers.push({id:Date.now(),name,phone,due,history:due?[{date:today(),type:'opening',amount:due,note:'শুরুর বাকি'}]:[],note})}
 closeModal();save();toast('কাস্টমার সংরক্ষণ হয়েছে');
}
function openCollection(id=null){
 if(!db.customers.length)return toast('আগে কাস্টমার যোগ করুন');
 openSheet(`<button class="close" onclick="closeModal()">✕</button><h2>বাকি আদায়</h2><label>কাস্টমার</label><select id="colCust">${db.customers.map(c=>`<option value="${c.id}" ${id==c.id?'selected':''}>${esc(c.name)} — বাকি ${money(c.due)}</option>`).join('')}</select><label>তারিখ</label><input id="colDate" type="date" value="${today()}"><label>আদায়ের পরিমাণ</label><input id="colAmount" type="number" min="0" step=".01"><label>নোট</label><textarea id="colNote"></textarea><button class="btn" style="width:100%;margin-top:12px" onclick="saveCollection()">সংরক্ষণ</button>`);
}
function saveCollection(){
 let id=+document.getElementById('colCust').value,c=db.customers.find(x=>x.id===id),a=+document.getElementById('colAmount').value||0,d=document.getElementById('colDate').value||today(),n=document.getElementById('colNote').value;if(!c||a<=0)return toast('সঠিক তথ্য দিন');if(a>c.due)return toast('আদায়ের পরিমাণ বাকি থেকে বেশি');
 c.due-=a;c.history=c.history||[];c.history.push({date:d,type:'collection',amount:a,note:n});day(d).collections=(day(d).collections||0)+a;addActivity('বাকি আদায়',c.name,a,d);closeModal();save();toast('আদায় সংরক্ষণ হয়েছে');
}
function renderHome(){
 let x=day(),sales=x.cash+x.credit,exp=(x.purchase||0)+(x.rent||0)+(x.other||0),profit=sales-exp;
 ['todaySales','todayExpense','todayCredit','todayCollection'].forEach((id,i)=>document.getElementById(id).textContent=money([sales,exp,x.credit,x.collections||0][i]));
 document.getElementById('todayProfit').textContent=money(profit);document.getElementById('todayProfit').className='big money '+(profit>=0?'pos':'neg');
 let credits=(x.sales||[]).filter(s=>s.kind==='credit');document.getElementById('todayCreditList').innerHTML=credits.length?credits.map(s=>{let c=findCustomerForSale(s);return `<div class="item"><div class="toprow"><strong>${esc(c?.name||'কাস্টমার')}</strong><b class="money">${money(s.amount)}</b></div><small>${esc(s.note||'বাকি বিক্রি')}</small></div>`}).join(''):'<div class="empty">আজ কোনো বাকি বিক্রি নেই</div>';
 document.getElementById('activityList').innerHTML=db.activities.slice(0,8).map(a=>`<div class="item"><div class="toprow"><strong>${esc(a.type)}</strong><b class="money">${money(a.amount)}</b></div><small>${fmtDate(a.date)} · ${esc(a.text||'')}</small></div>`).join('')||'<div class="empty">এখনও কোনো কার্যক্রম নেই</div>';
}
function findCustomerForSale(s){return db.customers.find(c=>c.history?.some(h=>h.date===today()&&h.type==='credit'&&h.amount===s.amount))}
function renderSales(){
 let x=day(),m=monthNow(),ms=monthTotals(m);document.getElementById('salesCash').textContent=money(x.cash);document.getElementById('salesCredit').textContent=money(x.credit);document.getElementById('salesTotal').textContent=money(x.cash+x.credit);document.getElementById('monthSales').textContent=money(ms.sales);
 if(!document.getElementById('salesFrom').value)document.getElementById('salesFrom').value=m+'-01';if(!document.getElementById('salesTo').value)document.getElementById('salesTo').value=today();renderSalesReport();
}
function renderSalesReport(){
 let f=document.getElementById('salesFrom').value,t=document.getElementById('salesTo').value,rows=[];Object.keys(db.days).sort().reverse().forEach(d=>{if(d>=f&&d<=t){let x=db.days[d],s=x.cash+x.credit;if(s)rows.push(`<tr><td>${fmtDate(d)}</td><td>${money(x.cash)}</td><td>${money(x.credit)}</td><td><b>${money(s)}</b></td></tr>`)}});document.getElementById('salesReport').innerHTML=`<table><thead><tr><th>তারিখ</th><th>নগদ</th><th>বাকি</th><th>মোট</th></tr></thead><tbody>${rows.join('')||'<tr><td colspan="4">কোনো বিক্রির তথ্য নেই</td></tr>'}</tbody></table>`;
}
function renderCustomers(){
 let q=(document.getElementById('customerSearch').value||'').toLowerCase(),arr=db.customers.filter(c=>(c.name+' '+c.phone).toLowerCase().includes(q));document.getElementById('customerCount').textContent=db.customers.length;document.getElementById('totalDue').textContent=money(db.customers.reduce((a,c)=>a+(c.due||0),0));document.getElementById('customerTodayCredit').textContent=money(day().credit);document.getElementById('customerTodayCollection').textContent=money(day().collections||0);
 document.getElementById('customerList').innerHTML=arr.map(c=>`<div class="item"><div class="toprow"><div><strong>${esc(c.name)}</strong><br><small>${esc(c.phone||'মোবাইল নেই')}</small></div><b class="${c.due?'neg':'pos'} money">${money(c.due||0)}</b></div><div class="row" style="margin-top:8px"><button class="btn fit" onclick="openCollection(${c.id})">আদায়</button><button class="btn secondary fit" onclick="openCustomer(${c.id})">এডিট</button><button class="btn gray fit" onclick="showHistory(${c.id})">রিপোর্ট</button><button class="btn danger fit" onclick="deleteCustomer(${c.id})">ডিলিট</button></div></div>`).join('')||'<div class="empty">কোনো কাস্টমার পাওয়া যায়নি</div>';
 document.getElementById('reportCustomer').innerHTML='<option value="">কাস্টমার নির্বাচন করুন</option>'+db.customers.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
}
function showHistory(id){let c=db.customers.find(x=>x.id===id);if(!c)return;openSheet(`<button class="close" onclick="closeModal()">✕</button><h2>${esc(c.name)} — হিসাব</h2><div class="cards"><div class="stat"><div class="label">বর্তমান বাকি</div><b>${money(c.due)}</b></div></div><div class="tablewrap"><table><thead><tr><th>তারিখ</th><th>ধরন</th><th>পরিমাণ</th><th>নোট</th></tr></thead><tbody>${(c.history||[]).slice().reverse().map(h=>`<tr><td>${fmtDate(h.date)}</td><td>${h.type==='credit'?'বাকি বিক্রি':h.type==='collection'?'আদায়':'শুরুর বাকি'}</td><td>${money(h.amount)}</td><td>${esc(h.note||'')}</td></tr>`).join('')||'<tr><td colspan="4">কোনো তথ্য নেই</td></tr>'}</tbody></table></div>`)}
function deleteCustomer(id){let c=db.customers.find(x=>x.id===id);if(!c)return;if(!confirm(`"${c.name}" কাস্টমারটি মুছে ফেলবেন?`))return;if((c.due||0)>0&&!confirm('এই কাস্টমারের বাকি আছে। তবুও মুছবেন?'))return;db.customers=db.customers.filter(x=>x.id!==id);save();toast('কাস্টমার মুছে ফেলা হয়েছে')}
function monthTotals(m){
 let out={sales:0,expense:0,profit:0,collection:0};Object.entries(db.days).forEach(([d,x])=>{if(d.startsWith(m)){let s=(x.cash||0)+(x.credit||0),e=(x.purchase||0)+(x.rent||0)+(x.other||0);out.sales+=s;out.expense+=e;out.profit+=s-e;out.collection+=x.collections||0}});return out
}
function renderMonthlyReport(){
 let m=document.getElementById('reportMonth').value||monthNow();document.getElementById('reportMonth').value=m;let t=monthTotals(m);document.getElementById('rSales').textContent=money(t.sales);document.getElementById('rExpense').textContent=money(t.expense);document.getElementById('rProfit').textContent=money(t.profit);document.getElementById('rCollection').textContent=money(t.collection);
 let rows=Object.keys(db.days).filter(d=>d.startsWith(m)).sort().reverse().map(d=>{let x=db.days[d],s=(x.cash||0)+(x.credit||0),e=(x.purchase||0)+(x.rent||0)+(x.other||0),p=s-e;return `<tr><td>${fmtDate(d)}</td><td>${money(s)}</td><td>${money(x.cash)}</td><td>${money(x.credit)}</td><td>${money(e)}</td><td class="${p>=0?'pos':'neg'}">${money(p)}</td><td>${money(x.collections||0)}</td></tr>`}).join('');document.getElementById('monthlyTable').innerHTML=`<table><thead><tr><th>তারিখ</th><th>বিক্রি</th><th>নগদ</th><th>বাকি</th><th>খরচ</th><th>লাভ/ক্ষতি</th><th>আদায়</th></tr></thead><tbody>${rows||'<tr><td colspan="7">এই মাসে কোনো হিসাব নেই</td></tr>'}</tbody></table>`;
}
function renderCustomerReport(){
 let id=+document.getElementById('reportCustomer').value,d=document.getElementById('reportCustomerDate').value,c=db.customers.find(x=>x.id===id);if(!c){document.getElementById('customerReport').innerHTML='<div class="empty">কাস্টমার নির্বাচন করুন</div>';return}let hs=(c.history||[]).filter(h=>!d||h.date===d).slice().reverse();document.getElementById('customerReport').innerHTML=`<div class="stat"><div class="label">বর্তমান বাকি</div><b>${money(c.due)}</b></div><div class="tablewrap" style="margin-top:10px"><table><thead><tr><th>তারিখ</th><th>ধরন</th><th>পরিমাণ</th><th>নোট</th></tr></thead><tbody>${hs.map(h=>`<tr><td>${fmtDate(h.date)}</td><td>${h.type==='credit'?'বাকি বিক্রি':h.type==='collection'?'আদায়':'শুরুর বাকি'}</td><td>${money(h.amount)}</td><td>${esc(h.note||'')}</td></tr>`).join('')||'<tr><td colspan="4">এই তারিখে কোনো লেনদেন নেই</td></tr>'}</tbody></table></div>`}
function renderMore(){
 let m=monthTotals(monthNow());document.getElementById('expenseSummary').innerHTML=`<div class="item">পণ্য ক্রয় <b class="money">${money(sumType('purchase',monthNow()))}</b></div><div class="item">ভাড়া/পরিবহন <b class="money">${money(sumType('rent',monthNow()))}</b></div><div class="item">অন্যান্য <b class="money">${money(sumType('other',monthNow()))}</b></div>`;document.getElementById('cashbookSummary').innerHTML=`<div class="item">এই মাসে বিক্রি <b>${money(m.sales)}</b></div><div class="item">এই মাসে খরচ <b>${money(m.expense)}</b></div><div class="item">নিট লাভ <b class="${m.profit>=0?'pos':'neg'}">${money(m.profit)}</b></div><div class="item">বাকি আদায় <b>${money(m.collection)}</b></div>`;
}
function sumType(type,m){return Object.entries(db.days).filter(([d])=>d.startsWith(m)).reduce((a,[,x])=>a+(x[type]||0),0)}
function openDrive(){window.open('https://drive.google.com/drive/my-drive','_blank')}\nfunction backup(){let blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='amar-byabsha-amar-hisab-backup-'+today()+'.json';a.click();URL.revokeObjectURL(a.href);toast('ব্যাকআপ ডাউনলোড হয়েছে')}
function restore(e){let f=e.target.files[0];if(!f)return;let r=new FileReader();r.onload=()=>{try{let x=JSON.parse(r.result);if(!x.days||!x.customers)throw 0;if(confirm('বর্তমান হিসাবের জায়গায় এই ব্যাকআপ বসাবেন?')){db=x;save();toast('ব্যাকআপ রিস্টোর হয়েছে')}}catch(err){toast('ব্যাকআপ ফাইল সঠিক নয়')}};r.readAsText(f);e.target.value=''}
function resetData(){if(!confirm('সব হিসাব মুছে ফেলবেন?'))return;if(!confirm('শেষবার নিশ্চিত করুন — এই কাজ ফেরত আনা যাবে না।'))return;localStorage.removeItem(KEY);db=loadDB();renderAll();toast('সব হিসাব মুছে দেওয়া হয়েছে')}
function saveBusinessName(){toast('নাম সংরক্ষণ হয়েছে');closeModal()}
function renderAll(){document.getElementById('todayText').textContent=new Date().toLocaleDateString('bn-BD',{weekday:'long',year:'numeric',month:'long',day:'numeric'});renderHome();renderSales();renderCustomers();renderMonthlyReport();renderMore()}
document.getElementById('reportMonth').value=monthNow();renderAll();
