import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, serverTimestamp, increment, query, orderBy, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC-ue-TpgxmCBvAo8fGrQlhgdnVCl6ss4M",
  authDomain: "usarabguide.firebaseapp.com",
  projectId: "usarabguide",
  storageBucket: "usarabguide.firebasestorage.app",
  messagingSenderId: "376062227343",
  appId: "1:376062227343:web:e73e29d752d3a0852911fa",
  measurementId: "G-JHXW2WHVYX"
};
const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

const seeds = {
  businesses: [
    {name:"Levant Table", type:"Lebanese • Syrian", city:"Northern Virginia", desc:"Modern Arab dining, shawarma, kebab, mezze, family platters and catering.", icon:"🥙", tag:"Restaurant"},
    {name:"Cedar Sweets", type:"Kunafa • Baklava • Coffee", city:"Maryland", desc:"Arabic sweets, coffee, party trays and premium desserts for events.", icon:"🍰", tag:"Dessert Café"}
  ],
  events: [
    {title:"Arab Culture Night", date:"June 15", location:"Washington, DC", price:"$25", desc:"Music, food, dabke, vendors and a family-friendly cultural celebration.", icon:"🎶"},
    {title:"Arab Business Mixer", date:"June 22", location:"Northern Virginia", price:"Free RSVP", desc:"Networking for founders, restaurants and service providers.", icon:"🤝"}
  ],
  groups: [
    {name:"Arabs in Virginia", category:"City Group", members:1240, joined:false, desc:"Local events, restaurants, family recommendations and business support.", icon:"🏙️"},
    {name:"Arab Business Owners", category:"Business", members:870, joined:false, desc:"Networking, promotion, partnerships and service provider introductions.", icon:"💼"}
  ],
  posts: [
    {name:"Maya A.", text:"Best Arabic bakery near Tysons? Looking for fresh kunafa and baklava recommendations.", likes:18, comments:7, icon:"🍰"},
    {name:"Omar K.", text:"We are planning an Arab business networking event next month. Vendors and sponsors are welcome.", likes:31, comments:12, icon:"🎟️"}
  ],
  listings: [
    {title:"Restaurant hiring cashier", category:"Jobs", desc:"Part-time weekend cashier needed for Arabic restaurant.", icon:"💼"}
  ]
};

let businesses=[], events=[], groups=[], posts=[], listings=[], requests=[];
let adminOn = sessionStorage.getItem("usarab_admin_v9") === "yes";

function toast(message){ const box=document.getElementById("toast"); box.textContent=message; box.classList.add("show"); setTimeout(()=>box.classList.remove("show"),2400); }
function toggleMenu(){ document.getElementById("mainMenu").classList.toggle("show"); }
function showPage(pageId){ document.querySelectorAll(".page").forEach(p=>p.classList.remove("active")); document.getElementById(pageId).classList.add("active"); document.getElementById("mainMenu").classList.remove("show"); window.scrollTo({top:0,behavior:"smooth"}); if(pageId==="admin") refreshAdmin(); }

async function seedIfEmpty(name, items){
  const snap = await getDocs(collection(db, name));
  if(snap.empty){
    const batch = writeBatch(db);
    items.forEach(item => batch.set(doc(collection(db, name)), {...item, createdAt: serverTimestamp()}));
    await batch.commit();
  }
}
async function seedDatabase(){ for(const [k,v] of Object.entries(seeds)){ await seedIfEmpty(k,v); } }
function listen(name, setter){
  const q = query(collection(db, name), orderBy("createdAt","desc"));
  onSnapshot(q, snap => { setter(snap.docs.map(d=>({id:d.id,...d.data()}))); renderAll(); }, err => { console.error(err); toast("Firebase error. Check Firestore rules."); });
}

function renderBusinesses(){ businessList.innerHTML = businesses.map(b=>`<article class="item-card searchable" data-search="${Object.values(b).join(" ").toLowerCase()}"><div class="item-cover">${b.icon||"⭐"}</div><div class="item-body"><span class="tag">${b.tag||"Business"}</span><h3>${b.name||""}</h3><p class="meta">${b.type||"Business"} • ${b.city||"USA"}</p><p>${b.desc||""}</p><button onclick="toast('Business profile opens in demo mode')">View Details</button>${adminOn?`<button class="danger" onclick="deleteItem('businesses','${b.id}')">Delete</button>`:""}</div></article>`).join(""); }
function renderEvents(){ eventList.innerHTML = events.map(e=>`<article class="item-card searchable" data-search="${Object.values(e).join(" ").toLowerCase()}"><div class="item-cover">${e.icon||"🎟️"}</div><div class="item-body"><span class="tag">${e.price||"RSVP"}</span><h3>${e.title||""}</h3><p class="meta">${e.date||"Coming soon"} • ${e.location||"USA"}</p><p>${e.desc||""}</p><button onclick="toast('RSVP saved in demo mode')">RSVP / Tickets</button>${adminOn?`<button class="danger" onclick="deleteItem('events','${e.id}')">Delete</button>`:""}</div></article>`).join(""); }
function renderGroups(){ groupList.innerHTML = groups.map(g=>`<article class="item-card searchable" data-search="${Object.values(g).join(" ").toLowerCase()}"><div class="item-cover">${g.icon||"👥"}</div><div class="item-body"><span class="tag">${g.category||"Group"}</span><h3>${g.name||""}</h3><p class="meta">${Number(g.members||0).toLocaleString()} members</p><p>${g.desc||""}</p><button class="${g.joined?'joined':''}" onclick="joinGroup('${g.id}',${!!g.joined})">${g.joined?"Joined ✓":"Join Group"}</button>${adminOn?`<button class="danger" onclick="deleteItem('groups','${g.id}')">Delete</button>`:""}</div></article>`).join(""); suggestedGroups.innerHTML=groups.slice(0,4).map(g=>`<div class="suggest-row"><div class="suggest-icon">${g.icon||"👥"}</div><div><b>${g.name}</b><br><small>${Number(g.members||0).toLocaleString()} members</small></div></div>`).join(""); }
function renderPosts(){ postList.innerHTML = posts.map(p=>`<article class="post searchable" data-search="${Object.values(p).join(" ").toLowerCase()}"><div class="post-head"><div class="avatar">${(p.name||"U").charAt(0).toUpperCase()}</div><div><h3>${p.name||"Community Member"}</h3><small>Community Member</small></div></div><p class="post-text">${p.text||""}</p><div class="post-media">${p.icon||"💬"}</div><div class="post-actions"><button onclick="likePost('${p.id}')">👍 ${Number(p.likes||0)}</button><button onclick="commentPost('${p.id}')">💬 ${Number(p.comments||0)}</button><button onclick="toast('Saved in demo mode')">🔖 Save</button><button onclick="toast('Shared in demo mode')">↗ Share</button></div>${adminOn?`<button class="danger" onclick="deleteItem('posts','${p.id}')">Delete Post</button>`:""}</article>`).join(""); }
function renderMarket(){ marketList.innerHTML = listings.map(l=>`<article class="item-card searchable" data-search="${Object.values(l).join(" ").toLowerCase()}"><div class="item-cover">${l.icon||"🛍️"}</div><div class="item-body"><span class="tag">${l.category||"General"}</span><h3>${l.title||""}</h3><p>${l.desc||""}</p><button onclick="toast('Contact request sent in demo mode')">Contact</button>${adminOn?`<button class="danger" onclick="deleteItem('listings','${l.id}')">Delete</button>`:""}</div></article>`).join(""); }
function renderSuggestedEvents(){ suggestedEvents.innerHTML = events.slice(0,4).map(e=>`<div class="suggest-row"><div class="suggest-icon">${e.icon||"🎟️"}</div><div><b>${e.title}</b><br><small>${e.date||""}</small></div></div>`).join(""); }

async function addPost(icon){ const name=postName.value.trim()||"Community Member"; const text=postText.value.trim(); if(!text){toast("Please write a post first");return;} await addDoc(collection(db,"posts"),{name,text,likes:0,comments:0,icon:icon||"💬",createdAt:serverTimestamp()}); postText.value=""; toast("Post saved to Firebase"); }
function openGroupForm(){ groupForm.classList.remove("hidden"); }
function closeGroupForm(){ groupForm.classList.add("hidden"); }
async function addGroup(){ const name=groupName.value.trim(), category=groupCategory.value.trim()||"Community", desc=groupDesc.value.trim(); if(!name||!desc){toast("Please add group name and description");return;} await addDoc(collection(db,"groups"),{name,category,desc,members:1,joined:true,icon:"👥",createdAt:serverTimestamp()}); groupName.value=groupCategory.value=groupDesc.value=""; closeGroupForm(); toast("Group saved to Firebase"); }
async function addListing(){ const title=listingTitle.value.trim(), category=listingCategory.value.trim()||"General", desc=listingDesc.value.trim(); if(!title||!desc){toast("Please add title and description");return;} await addDoc(collection(db,"listings"),{title,category,desc,icon:"🛍️",createdAt:serverTimestamp()}); listingTitle.value=listingCategory.value=listingDesc.value=""; toast("Listing saved to Firebase"); }
async function submitJoin(){ const name=joinName.value.trim(), email=joinEmail.value.trim(), city=joinCity.value.trim(), type=joinType.value; if(!name||!email){toast("Please add name and email");return;} await addDoc(collection(db,"requests"),{name,email,city,type,date:new Date().toLocaleString(),createdAt:serverTimestamp()}); joinName.value=joinEmail.value=joinCity.value=""; toast("Join request saved to Firebase"); }
async function likePost(id){ await updateDoc(doc(db,"posts",id),{likes:increment(1)}); }
async function commentPost(id){ await updateDoc(doc(db,"posts",id),{comments:increment(1)}); toast("Comment added in demo mode"); }
async function joinGroup(id, joined){ await updateDoc(doc(db,"groups",id),{joined:!joined,members:increment(joined?-1:1)}); toast(joined?"You left the group":"You joined the group"); }
function loginAdmin(){ if(adminPassword.value==="admin123"){ adminOn=true; sessionStorage.setItem("usarab_admin_v9","yes"); refreshAdmin(); renderAll(); toast("Owner admin activated"); } else toast("Wrong password"); }
function logoutAdmin(){ adminOn=false; sessionStorage.removeItem("usarab_admin_v9"); refreshAdmin(); renderAll(); toast("Admin logged out"); }
function refreshAdmin(){ adminLogin.classList.toggle("hidden",adminOn); adminPanel.classList.toggle("hidden",!adminOn); if(!adminOn)return; statBusinesses.textContent=businesses.length; statEvents.textContent=events.length; statGroups.textContent=groups.length; statPosts.textContent=posts.length; statRequests.textContent=requests.length; adminRequests.innerHTML=requests.length?requests.map(r=>`<div class="admin-row"><div><b>${r.name}</b><p>${r.email} • ${r.city||""} • ${r.type||""}</p><small>${r.date||""}</small></div><button class="danger" onclick="deleteItem('requests','${r.id}')">Delete</button></div>`).join(""):"<p>No join requests yet.</p>"; adminPosts.innerHTML=posts.map(p=>`<div class="admin-row"><div><b>${p.name}</b><p>${p.text}</p></div><button class="danger" onclick="deleteItem('posts','${p.id}')">Delete</button></div>`).join(""); }
async function adminAddBusiness(){ const name=adminBizName.value.trim(), type=adminBizType.value.trim(), city=adminBizCity.value.trim(), desc=adminBizDesc.value.trim(); if(!name||!desc){toast("Add business name and description");return;} await addDoc(collection(db,"businesses"),{name,type:type||"Business",city:city||"USA",desc,icon:"⭐",tag:"Business",createdAt:serverTimestamp()}); adminBizName.value=adminBizType.value=adminBizCity.value=adminBizDesc.value=""; toast("Business saved to Firebase"); }
async function adminAddEvent(){ const title=adminEventTitle.value.trim(), date=adminEventDate.value.trim(), location=adminEventLocation.value.trim(), price=adminEventPrice.value.trim(), desc=adminEventDesc.value.trim(); if(!title||!desc){toast("Add event title and description");return;} await addDoc(collection(db,"events"),{title,date:date||"Coming soon",location:location||"USA",price:price||"RSVP",desc,icon:"🎟️",createdAt:serverTimestamp()}); adminEventTitle.value=adminEventDate.value=adminEventLocation.value=adminEventPrice.value=adminEventDesc.value=""; toast("Event saved to Firebase"); }
async function deleteItem(col,id){ if(confirm("Delete this item from Firebase?")){ await deleteDoc(doc(db,col,id)); toast("Deleted from Firebase"); } }
function searchItems(){ const q=searchInput.value.toLowerCase(); const active=document.querySelector(".page.active"); if(q.length>1&&active&&active.id==="home")showPage("discover"); setTimeout(()=>document.querySelectorAll(".searchable").forEach(item=>{const text=item.dataset.search||""; item.style.display=!q||text.includes(q)?"":"none";}),80); }
function renderAll(){ renderBusinesses(); renderEvents(); renderGroups(); renderPosts(); renderMarket(); renderSuggestedEvents(); refreshAdmin(); }

Object.assign(window,{toast,toggleMenu,showPage,searchItems,addPost,openGroupForm,closeGroupForm,addGroup,addListing,submitJoin,likePost,commentPost,joinGroup,loginAdmin,logoutAdmin,adminAddBusiness,adminAddEvent,deleteItem});

await seedDatabase();
listen("businesses",data=>businesses=data);
listen("events",data=>events=data);
listen("groups",data=>groups=data);
listen("posts",data=>posts=data);
listen("listings",data=>listings=data);
listen("requests",data=>requests=data);
showPage("home");