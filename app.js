import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, setDoc, onSnapshot, serverTimestamp, increment, query, orderBy, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

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
const auth = getAuth(fbApp);
const storage = getStorage(fbApp);

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

let currentUser = null;
let users = [];
let friendRequests = [];
let selectedFile = null;
let selectedMediaKind = "";


async function saveUserProfile(user, extra = {}){
  if(!user) return;
  const displayName = user.displayName || extra.name || (user.email ? user.email.split("@")[0] : "USArab Member");
  const userData = {
    uid: user.uid,
    name: displayName,
    nameLower: displayName.toLowerCase(),
    email: user.email || "",
    emailLower: (user.email || "").toLowerCase(),
    role: extra.role || "member",
    city: extra.city || "",
    photoURL: user.photoURL || "",
    searchable: `${displayName} ${user.email || ""} ${extra.city || ""} member`.toLowerCase(),
    lastLoginAt: serverTimestamp()
  };
  if(extra.createdAt) userData.createdAt = extra.createdAt;
  await setDoc(doc(db, "users", user.uid), userData, { merge: true });
}

function openAuthModal(){
  document.getElementById("authModal").classList.remove("hidden");
}
function closeAuthModal(){
  document.getElementById("authModal").classList.add("hidden");
}
async function signUpUser(){
  const name = authNameInput.value.trim();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  if(!name || !email || !password){
    toast("Please add name, email, and password");
    return;
  }
  try{
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, {displayName:name});
    await saveUserProfile(result.user, {name, createdAt: serverTimestamp()});
    closeAuthModal();
    toast("Account created");
  }catch(error){
    toast(error.message);
  }
}
async function signInUser(){
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value;
  if(!email || !password){
    toast("Please add email and password");
    return;
  }
  try{
    const result = await signInWithEmailAndPassword(auth, email, password);
    await saveUserProfile(result.user);
    closeAuthModal();
    toast("Signed in");
  }catch(error){
    toast(error.message);
  }
}
async function logoutUser(){
  await signOut(auth);
  toast("Logged out");
}
onAuthStateChanged(auth, user => {
  currentUser = user; renderMembers();
  const authStatus = document.getElementById("authStatus");
  const authButton = document.getElementById("authButton");
  const logoutButton = document.getElementById("logoutButton");

  if(user){
    saveUserProfile(user);
    authStatus.textContent = user.displayName || user.email;
    authButton.classList.add("hidden");
    logoutButton.classList.remove("hidden");
    const nameInput = document.getElementById("postName");
    if(nameInput) nameInput.value = user.displayName || user.email;
  }else{
    authStatus.textContent = "Guest";
    authButton.classList.remove("hidden");
    logoutButton.classList.add("hidden");
  }
});

function selectMediaFile(icon, label){
  choosePostType(icon, label);
  const fileInput = document.getElementById("mediaFile");
  if(label.toLowerCase().includes("photo")){
    fileInput.accept = "image/*";
    selectedMediaKind = "image";
  }else{
    fileInput.accept = "video/*";
    selectedMediaKind = "video";
  }
  fileInput.click();
}

function handleMediaSelected(event){
  const file = event.target.files[0];
  if(!file) return;
  selectedFile = file;
  const preview = document.getElementById("mediaPreview");
  preview.classList.remove("hidden");

  const url = URL.createObjectURL(file);
  if(file.type.startsWith("image/")){
    selectedMediaKind = "image";
    preview.innerHTML = `<img src="${url}" alt="Selected photo"><div class="upload-hint">📷 Photo selected: ${file.name}</div>`;
  }else if(file.type.startsWith("video/")){
    selectedMediaKind = "video";
    preview.innerHTML = `<video src="${url}" controls></video><div class="upload-hint">🎥 Video selected: ${file.name}</div>`;
  }else{
    selectedFile = null;
    preview.innerHTML = "Unsupported file type.";
  }
}

async function uploadSelectedMedia(){
  if(!selectedFile) return {mediaUrl:"", mediaType:""};

  if(!currentUser){
    toast("Please sign in before uploading photo or video");
    throw new Error("User must sign in before media upload");
  }

  const isVideo = selectedFile.type.startsWith("video/");
  const isImage = selectedFile.type.startsWith("image/");

  if(!isImage && !isVideo){
    toast("Only photo or video files are allowed");
    throw new Error("Unsupported media type");
  }

  const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
  if(selectedFile.size > maxSize){
    toast(isVideo ? "Video is too large. Use under 50MB." : "Photo is too large. Use under 10MB.");
    throw new Error("File too large");
  }

  const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `posts/${currentUser.uid}/${Date.now()}-${safeName}`;

  try{
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, selectedFile, { contentType: selectedFile.type });
    const mediaUrl = await getDownloadURL(fileRef);
    return {mediaUrl, mediaType:isVideo ? "video" : "image"};
  }catch(error){
    console.error("Upload failed:", error);
    toast("Upload failed. Enable Firebase Storage and check Storage Rules.");
    throw error;
  }
}


let selectedPostIcon = "💬";
let selectedPostType = "General Post";

function choosePostType(icon, label){
  selectedPostIcon = icon;
  selectedPostType = label;
  const selected = document.getElementById("selectedPostType");
  if(selected) selected.textContent = "Selected: " + icon + " " + label;

  const preview = document.getElementById("mediaPreview");
  if(preview){
    if(icon === "📷"){
      preview.classList.remove("hidden");
      preview.textContent = "📷 Photo option selected — real photo upload will connect with Firebase Storage next.";
    } else if(icon === "🎥"){
      preview.classList.remove("hidden");
      preview.textContent = "🎥 Video option selected — real video upload will connect with Firebase Storage next.";
    } else if(icon === "🎟️"){
      preview.classList.remove("hidden");
      preview.textContent = "🎟️ Event notice selected — write the event details in your post.";
    } else if(icon === "🛍️"){
      preview.classList.remove("hidden");
      preview.textContent = "🛍️ Marketplace post selected — describe what you are offering or looking for.";
    } else {
      preview.classList.add("hidden");
      preview.textContent = "";
    }
  }
}

function addSelectedPost(){
  addPost(selectedPostIcon, selectedPostType);
}


const US_MAJOR_CITIES = {
  "Alabama": ["Birmingham", "Montgomery", "Huntsville", "Mobile", "Tuscaloosa"],
  "Alaska": ["Anchorage", "Fairbanks", "Juneau"],
  "Arizona": ["Phoenix", "Tucson", "Mesa", "Scottsdale", "Tempe"],
  "Arkansas": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale"],
  "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Fresno", "Oakland", "Irvine"],
  "Colorado": ["Denver", "Colorado Springs", "Aurora", "Boulder", "Fort Collins"],
  "Connecticut": ["Bridgeport", "New Haven", "Hartford", "Stamford"],
  "Delaware": ["Wilmington", "Dover", "Newark"],
  "Florida": ["Miami", "Orlando", "Tampa", "Jacksonville", "Fort Lauderdale", "Tallahassee"],
  "Georgia": ["Atlanta", "Savannah", "Augusta", "Columbus", "Athens"],
  "Hawaii": ["Honolulu", "Hilo", "Kailua"],
  "Idaho": ["Boise", "Meridian", "Idaho Falls"],
  "Illinois": ["Chicago", "Aurora", "Naperville", "Springfield", "Peoria"],
  "Indiana": ["Indianapolis", "Fort Wayne", "South Bend", "Evansville"],
  "Iowa": ["Des Moines", "Cedar Rapids", "Davenport", "Iowa City"],
  "Kansas": ["Wichita", "Overland Park", "Kansas City", "Topeka"],
  "Kentucky": ["Louisville", "Lexington", "Bowling Green", "Frankfort"],
  "Louisiana": ["New Orleans", "Baton Rouge", "Shreveport", "Lafayette"],
  "Maine": ["Portland", "Augusta", "Bangor"],
  "Maryland": ["Baltimore", "Rockville", "Silver Spring", "Bethesda", "Annapolis", "Gaithersburg"],
  "Massachusetts": ["Boston", "Cambridge", "Worcester", "Springfield", "Lowell"],
  "Michigan": ["Detroit", "Grand Rapids", "Ann Arbor", "Lansing", "Dearborn"],
  "Minnesota": ["Minneapolis", "Saint Paul", "Rochester", "Duluth"],
  "Mississippi": ["Jackson", "Gulfport", "Hattiesburg"],
  "Missouri": ["Kansas City", "St. Louis", "Springfield", "Columbia"],
  "Montana": ["Billings", "Missoula", "Bozeman", "Helena"],
  "Nebraska": ["Omaha", "Lincoln", "Bellevue"],
  "Nevada": ["Las Vegas", "Reno", "Henderson"],
  "New Hampshire": ["Manchester", "Nashua", "Concord"],
  "New Jersey": ["Newark", "Jersey City", "Paterson", "Edison", "Trenton"],
  "New Mexico": ["Albuquerque", "Santa Fe", "Las Cruces"],
  "New York": ["New York City", "Buffalo", "Rochester", "Albany", "Syracuse"],
  "North Carolina": ["Charlotte", "Raleigh", "Greensboro", "Durham", "Chapel Hill"],
  "North Dakota": ["Fargo", "Bismarck", "Grand Forks"],
  "Ohio": ["Columbus", "Cleveland", "Cincinnati", "Toledo", "Dayton"],
  "Oklahoma": ["Oklahoma City", "Tulsa", "Norman"],
  "Oregon": ["Portland", "Salem", "Eugene", "Bend"],
  "Pennsylvania": ["Philadelphia", "Pittsburgh", "Allentown", "Harrisburg"],
  "Rhode Island": ["Providence", "Warwick", "Cranston"],
  "South Carolina": ["Charleston", "Columbia", "Greenville", "Myrtle Beach"],
  "South Dakota": ["Sioux Falls", "Rapid City", "Pierre"],
  "Tennessee": ["Nashville", "Memphis", "Knoxville", "Chattanooga"],
  "Texas": ["Houston", "Dallas", "Austin", "San Antonio", "Fort Worth", "Plano", "Irving"],
  "Utah": ["Salt Lake City", "Provo", "Ogden", "St. George"],
  "Vermont": ["Burlington", "Montpelier", "Rutland"],
  "Virginia": ["Northern Virginia", "Arlington", "Alexandria", "Fairfax", "Herndon", "Richmond", "Virginia Beach", "Norfolk"],
  "Washington": ["Seattle", "Tacoma", "Spokane", "Bellevue", "Olympia"],
  "Washington, DC": ["Washington, DC"],
  "West Virginia": ["Charleston", "Morgantown", "Huntington"],
  "Wisconsin": ["Milwaukee", "Madison", "Green Bay", "Kenosha"],
  "Wyoming": ["Cheyenne", "Casper", "Laramie"]
};

function populateStates(){
  const stateSelect = document.getElementById("adminEventState");
  if(!stateSelect || stateSelect.dataset.loaded === "yes") return;
  Object.keys(US_MAJOR_CITIES).forEach(state => {
    const option = document.createElement("option");
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });
  stateSelect.dataset.loaded = "yes";
}

function loadMajorCities(){
  const state = document.getElementById("adminEventState").value;
  const citySelect = document.getElementById("adminEventCity");
  citySelect.innerHTML = '<option value="">Select City</option>';
  (US_MAJOR_CITIES[state] || []).forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    citySelect.appendChild(option);
  });
}


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

function listenLoose(name, setter){
  onSnapshot(collection(db, name), snap => {
    const data = snap.docs.map(d => ({id:d.id, ...d.data()}));
    data.sort((a,b) => {
      const an = (a.name || a.email || "").toLowerCase();
      const bn = (b.name || b.email || "").toLowerCase();
      return an.localeCompare(bn);
    });
    setter(data);
    renderAll();
  }, err => {
    console.error(err);
    toast("Firebase read error. Check Firestore rules.");
  });
}


function renderBusinesses(){ businessList.innerHTML = businesses.map(b=>`<article class="item-card searchable" data-search="${Object.values(b).join(" ").toLowerCase()}"><div class="item-cover">${b.icon||"⭐"}</div><div class="item-body"><span class="tag">${b.tag||"Business"}</span><h3>${b.name||""}</h3><p class="meta">${b.type||"Business"} • ${b.city||"USA"}</p><p>${b.desc||""}</p><button onclick="toast('Business profile opens in demo mode')">View Details</button>${adminOn?`<button class="danger" onclick="deleteItem('businesses','${b.id}')">Delete</button>`:""}</div></article>`).join(""); }
function renderEvents(){ eventList.innerHTML = events.map(e=>`<article class="item-card searchable" data-search="${Object.values(e).join(" ").toLowerCase()}"><div class="item-cover">${e.icon||"🎟️"}</div><div class="item-body"><span class="tag">${e.price||"RSVP"}</span><h3>${e.title||""}</h3><p class="meta">${e.date||"Coming soon"} • ${e.location||"USA"}</p><p>${e.desc||""}</p><button onclick="toast('RSVP saved in demo mode')">RSVP / Tickets</button>${adminOn?`<button class="danger" onclick="deleteItem('events','${e.id}')">Delete</button>`:""}</div></article>`).join(""); }
function renderGroups(){ groupList.innerHTML = groups.map(g=>`<article class="item-card searchable" data-search="${Object.values(g).join(" ").toLowerCase()}"><div class="item-cover">${g.icon||"👥"}</div><div class="item-body"><span class="tag">${g.category||"Group"}</span><h3>${g.name||""}</h3><p class="meta">${Number(g.members||0).toLocaleString()} members</p><p>${g.desc||""}</p><button class="${g.joined?'joined':''}" onclick="joinGroup('${g.id}',${!!g.joined})">${g.joined?"Joined ✓":"Join Group"}</button>${adminOn?`<button class="danger" onclick="deleteItem('groups','${g.id}')">Delete</button>`:""}</div></article>`).join(""); suggestedGroups.innerHTML=groups.slice(0,4).map(g=>`<div class="suggest-row"><div class="suggest-icon">${g.icon||"👥"}</div><div><b>${g.name}</b><br><small>${Number(g.members||0).toLocaleString()} members</small></div></div>`).join(""); }
function renderPosts(){ postList.innerHTML = posts.map(p=>`<article class="post searchable" data-search="${Object.values(p).join(" ").toLowerCase()}"><div class="post-head"><div class="avatar">${(p.name||"U").charAt(0).toUpperCase()}</div><div><h3>${p.name||"Community Member"}</h3><small>${p.audience || "Public"} • ${p.postType || "Community Post"}</small></div></div><span class="post-type-pill">${p.icon || "💬"} ${p.postType || "Post"}</span><p class="post-text">${p.text||""}</p>${p.mediaUrl ? (p.mediaType === "video" ? `<div class="post-media has-real-media"><video src="${p.mediaUrl}" controls></video></div>` : `<div class="post-media has-real-media"><img src="${p.mediaUrl}" alt="Post media"></div>`) : `<div class="post-media">${p.icon||"💬"}</div>`}<div class="post-actions"><button onclick="likePost('${p.id}')">👍 ${Number(p.likes||0)}</button><button onclick="commentPost('${p.id}')">💬 ${Number(p.comments||0)}</button><button onclick="toast('Saved in demo mode')">🔖 Save</button><button onclick="toast('Shared in demo mode')">↗ Share</button></div>${adminOn?`<button class="danger" onclick="deleteItem('posts','${p.id}')">Delete Post</button>`:""}</article>`).join(""); }
function renderMarket(){ marketList.innerHTML = listings.map(l=>`<article class="item-card searchable" data-search="${Object.values(l).join(" ").toLowerCase()}"><div class="item-cover">${l.icon||"🛍️"}</div><div class="item-body"><span class="tag">${l.category||"General"}</span><h3>${l.title||""}</h3><p>${l.desc||""}</p><button onclick="toast('Contact request sent in demo mode')">Contact</button>${adminOn?`<button class="danger" onclick="deleteItem('listings','${l.id}')">Delete</button>`:""}</div></article>`).join(""); }
function renderSuggestedEvents(){ suggestedEvents.innerHTML = events.slice(0,4).map(e=>`<div class="suggest-row"><div class="suggest-icon">${e.icon||"🎟️"}</div><div><b>${e.title}</b><br><small>${e.date||""}</small></div></div>`).join(""); }

async function addPost(icon, typeLabel){
  const name = currentUser ? (currentUser.displayName || currentUser.email) : (postName.value.trim() || "Community Member");
  const text = postText.value.trim();
  const audience = document.getElementById("postAudience") ? postAudience.value : "Public";
  const postType = typeLabel || selectedPostType || "General Post";

  if(!currentUser){
    toast("Please sign in first to post");
    openAuthModal();
    return;
  }

  if(!text && !selectedFile){
    toast("Please write something or choose a photo/video");
    return;
  }

  let media = {mediaUrl:"", mediaType:""};
  if(selectedFile){
    toast("Uploading media...");
    try{
      media = await uploadSelectedMedia();
    }catch(error){
      return;
    }
  }

  await addDoc(collection(db,"posts"),{
    uid: currentUser.uid,
    email: currentUser.email,
    name,
    text,
    audience,
    postType,
    likes:0,
    comments:0,
    icon:icon || selectedPostIcon || "💬",
    mediaUrl: media.mediaUrl,
    mediaType: media.mediaType,
    createdAt:serverTimestamp()
  });

  postText.value = "";
  selectedFile = null;
  selectedMediaKind = "";
  const fileInput = document.getElementById("mediaFile");
  if(fileInput) fileInput.value = "";
  const preview = document.getElementById("mediaPreview");
  if(preview){
    preview.classList.add("hidden");
    preview.innerHTML = "";
  }
  choosePostType("💬","General Post");
  toast("Post saved to Firebase");
}
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
async function adminAddEvent(){
  const title = adminEventTitle.value.trim();
  const date = adminEventDate.value;
  const state = adminEventState.value;
  const city = adminEventCity.value;
  const price = adminEventPrice.value.trim();
  const desc = adminEventDesc.value.trim();

  if(!title || !date || !state || !city || !desc){
    toast("Please complete title, date, state, city, and description");
    return;
  }

  const location = city + ", " + state;

  await addDoc(collection(db,"events"),{
    title,
    date,
    state,
    city,
    location,
    price: price || "RSVP",
    desc,
    icon:"🎟️",
    createdAt:serverTimestamp()
  });

  adminEventTitle.value = "";
  adminEventDate.value = "";
  adminEventState.value = "";
  loadMajorCities();
  adminEventPrice.value = "";
  adminEventDesc.value = "";
  toast("Event saved to Firebase");
}
async function deleteItem(col,id){ if(confirm("Delete this item from Firebase?")){ await deleteDoc(doc(db,col,id)); toast("Deleted from Firebase"); } }
function searchItems(){ const q=searchInput.value.toLowerCase(); const active=document.querySelector(".page.active"); if(q.length>1&&active&&active.id==="home")showPage("discover"); setTimeout(()=>document.querySelectorAll(".searchable").forEach(item=>{const text=item.dataset.search||""; item.style.display=!q||text.includes(q)?"":"none";}),80); }

function friendshipStatus(otherUid){
  if(!currentUser) return "guest";
  if(otherUid === currentUser.uid) return "self";
  const existing = friendRequests.find(r =>
    (r.fromUid === currentUser.uid && r.toUid === otherUid) ||
    (r.toUid === currentUser.uid && r.fromUid === otherUid)
  );
  if(!existing) return "none";
  if(existing.status === "accepted") return "friends";
  if(existing.fromUid === currentUser.uid && existing.status === "pending") return "sent";
  if(existing.toUid === currentUser.uid && existing.status === "pending") return "received";
  return existing.status || "none";
}

function renderMembers(){
  const container = document.getElementById("membersList");
  if(!container) return;
  const searchBox = document.getElementById("memberSearchInput");
  const q = (searchBox ? searchBox.value : "").toLowerCase();

  const unique = [];
  const seen = new Set();
  users.forEach(u => {
    const uid = u.uid || u.id;
    if(uid && !seen.has(uid)){
      seen.add(uid);
      unique.push(u);
    }
  });

  const filtered = unique.filter(u => {
    const text = `${u.name || ""} ${u.email || ""} ${u.city || ""} ${u.role || ""} ${u.searchable || ""}`.toLowerCase();
    return !q || text.includes(q);
  });

  if(!filtered.length){
    container.innerHTML = `<div class="card empty-members">
      <h3>No members listed yet</h3>
      <p>Members will appear here automatically after they create an account or sign in.</p>
      <button onclick="openAuthModal()">Create First Member Account</button>
    </div>`;
    renderFriendRequestPanels();
    return;
  }

  container.innerHTML = filtered.map(u => {
    const uid = u.uid || u.id;
    const status = friendshipStatus(uid);
    let button = "";
    if(status === "guest") button = `<button onclick="openAuthModal()">Sign in to Add Friend</button>`;
    else if(status === "self") button = `<button class="secondary">This is You</button>`;
    else if(status === "none") button = `<button onclick="sendFriendRequest('${uid}', '${String(u.name || u.email || "Member").replace(/'/g,"").replace(/"/g,"")}')">Add Friend</button>`;
    else if(status === "sent") button = `<button class="secondary">Request Sent</button>`;
    else if(status === "received") button = `<button onclick="acceptFriendByUser('${uid}')">Accept Request</button>`;
    else if(status === "friends") button = `<button class="joined">Friends ✓</button>`;

    return `<article class="member-card searchable" data-search="${`${u.name || ""} ${u.email || ""} ${u.city || ""} ${u.role || ""}`.toLowerCase()}">
      <div class="member-top">
        <div class="avatar">${(u.name || u.email || "M").charAt(0).toUpperCase()}</div>
        <div>
          <h3>${u.name || "USArab Member"}</h3>
          <p>${u.role || "member"}</p>
        </div>
      </div>
      <p><b>Email:</b> ${u.email || "Hidden"}</p>
      <p><b>City:</b> ${u.city || "Not listed"}</p>
      <span class="friend-status">${status === "friends" ? "Friends" : status === "sent" ? "Request Sent" : status === "received" ? "Request Received" : status === "self" ? "Your Profile" : "Member"}</span>
      <div>${button}</div>
    </article>`;
  }).join("");

  renderFriendRequestPanels();
}

function renderFriendRequestPanels(){
  const receivedEl = document.getElementById("receivedRequestsList");
  const sentEl = document.getElementById("sentRequestsList");
  if(!receivedEl || !sentEl) return;

  if(!currentUser){
    receivedEl.innerHTML = "<p>Sign in to see requests.</p>";
    sentEl.innerHTML = "<p>Sign in to see sent requests.</p>";
    return;
  }

  const received = friendRequests.filter(r => r.toUid === currentUser.uid && r.status === "pending");
  const sent = friendRequests.filter(r => r.fromUid === currentUser.uid && r.status === "pending");

  receivedEl.innerHTML = received.map(r => `<div class="request-row">
    <div><b>${r.fromName || "Member"}</b><br><small>wants to be friends</small></div>
    <div class="request-actions">
      <button onclick="acceptFriendRequest('${r.id}')">Accept</button>
      <button class="danger" onclick="deleteItem('friendRequests','${r.id}')">Delete</button>
    </div>
  </div>`).join("") || "<p>No received requests.</p>";

  sentEl.innerHTML = sent.map(r => `<div class="request-row">
    <div><b>${r.toName || "Member"}</b><br><small>pending</small></div>
    <div class="request-actions"><button class="danger" onclick="deleteItem('friendRequests','${r.id}')">Cancel</button></div>
  </div>`).join("") || "<p>No sent requests.</p>";
}

async function sendFriendRequest(toUid, toName){
  if(!currentUser){
    openAuthModal();
    toast("Please sign in to add friends");
    return;
  }
  if(toUid === currentUser.uid){
    toast("You cannot add yourself");
    return;
  }
  const exists = friendRequests.find(r =>
    (r.fromUid === currentUser.uid && r.toUid === toUid) ||
    (r.toUid === currentUser.uid && r.fromUid === toUid)
  );
  if(exists){
    toast("Friend request already exists");
    return;
  }
  await addDoc(collection(db, "friendRequests"), {
    fromUid: currentUser.uid,
    fromName: currentUser.displayName || currentUser.email,
    toUid,
    toName,
    status: "pending",
    createdAt: serverTimestamp()
  });
  toast("Friend request sent");
}

async function acceptFriendRequest(requestId){
  await updateDoc(doc(db, "friendRequests", requestId), {status:"accepted", acceptedAt:serverTimestamp()});
  toast("Friend request accepted");
}

async function acceptFriendByUser(otherUid){
  if(!currentUser) return;
  const req = friendRequests.find(r => r.toUid === currentUser.uid && r.fromUid === otherUid && r.status === "pending");
  if(req) await acceptFriendRequest(req.id);
}


function renderAll(){ renderBusinesses(); renderEvents(); renderGroups(); renderPosts(); renderMarket(); renderSuggestedEvents(); renderMembers(); refreshAdmin(); if(typeof renderAdminLists === 'function') renderAdminLists(); }

Object.assign(window,{sendFriendRequest,acceptFriendRequest,acceptFriendByUser,renderMembers,toast,toggleMenu,showPage,searchItems,addPost,addSelectedPost,choosePostType,selectMediaFile,handleMediaSelected,openAuthModal,closeAuthModal,signUpUser,signInUser,logoutUser,openGroupForm,closeGroupForm,addGroup,addListing,submitJoin,likePost,commentPost,joinGroup,loginAdmin,logoutAdmin,adminAddBusiness,adminAddEvent,deleteItem,populateStates,loadMajorCities});



// ===== FULL ADMIN CRUD UPGRADE =====
function adminTab(name){
  ["Businesses","Events","Groups","Market","Posts","Requests"].forEach(section=>{
    const el = document.getElementById("admin" + section);
    if(el) el.classList.add("hidden");
  });
  const target = document.getElementById("admin" + name.charAt(0).toUpperCase() + name.slice(1));
  if(target) target.classList.remove("hidden");
}

function adminRow(title, meta, desc, editFn, deleteFn){
  return `<div class="admin-list-card">
    <div>
      <h4>${title || "Untitled"}</h4>
      <p><b>${meta || ""}</b></p>
      <p>${desc || ""}</p>
    </div>
    <div class="admin-actions">
      ${editFn ? `<button class="secondary" onclick="${editFn}">Edit</button>` : ""}
      ${deleteFn ? `<button class="danger" onclick="${deleteFn}">Delete</button>` : ""}
    </div>
  </div>`;
}

function renderAdminLists(){
  const bizList = document.getElementById("adminBusinessList");
  if(bizList) bizList.innerHTML = businesses.map(b => adminRow(
    b.name,
    `${b.type || "Business"} • ${b.city || "USA"} • ${b.tag || ""}`,
    b.desc,
    `editBusinessAdmin('${b.id}')`,
    `deleteItem('businesses','${b.id}')`
  )).join("") || "<p>No businesses yet.</p>";

  const evList = document.getElementById("adminEventList");
  if(evList) evList.innerHTML = events.map(e => adminRow(
    e.title,
    `${e.date || ""} • ${e.location || ""} • ${e.price || "RSVP"}`,
    e.desc,
    `editEventAdmin('${e.id}')`,
    `deleteItem('events','${e.id}')`
  )).join("") || "<p>No events yet.</p>";

  const groupList = document.getElementById("adminGroupList");
  if(groupList) groupList.innerHTML = groups.map(g => adminRow(
    g.name,
    `${g.category || "Group"} • ${Number(g.members || 0).toLocaleString()} members`,
    g.desc,
    `editGroupAdmin('${g.id}')`,
    `deleteItem('groups','${g.id}')`
  )).join("") || "<p>No groups yet.</p>";

  const marketList = document.getElementById("adminMarketList");
  if(marketList) marketList.innerHTML = listings.map(l => adminRow(
    l.title,
    l.category || "Listing",
    l.desc,
    `editMarketAdmin('${l.id}')`,
    `deleteItem('listings','${l.id}')`
  )).join("") || "<p>No listings yet.</p>";

  const postsList = document.getElementById("adminPostsList");
  if(postsList) postsList.innerHTML = posts.map(p => adminRow(
    p.name,
    `${Number(p.likes || 0)} likes • ${Number(p.comments || 0)} comments`,
    p.text,
    "",
    `deleteItem('posts','${p.id}')`
  )).join("") || "<p>No posts yet.</p>";

  const reqList = document.getElementById("adminRequestsList");
  if(reqList) reqList.innerHTML = requests.map(r => adminRow(
    r.name,
    `${r.email || ""} • ${r.city || ""} • ${r.type || ""}`,
    r.date || "",
    "",
    `deleteItem('requests','${r.id}')`
  )).join("") || "<p>No join requests yet.</p>";
}

function editBusinessAdmin(id){
  const b = businesses.find(x => x.id === id);
  if(!b) return;
  adminTab("businesses");
  adminBizId.value = b.id;
  adminBizName.value = b.name || "";
  adminBizType.value = b.type || "";
  adminBizCity.value = b.city || "";
  adminBizTag.value = b.tag || "";
  adminBizIcon.value = b.icon || "";
  adminBizDesc.value = b.desc || "";
  bizFormTitle.textContent = "Edit Restaurant / Business";
  window.scrollTo({top:0, behavior:"smooth"});
}

function clearBusinessForm(){
  adminBizId.value = "";
  adminBizName.value = "";
  adminBizType.value = "";
  adminBizCity.value = "";
  adminBizTag.value = "";
  adminBizIcon.value = "";
  adminBizDesc.value = "";
  bizFormTitle.textContent = "Add Restaurant / Business";
}

async function saveBusinessAdmin(){
  const data = {
    name: adminBizName.value.trim(),
    type: adminBizType.value.trim() || "Business",
    city: adminBizCity.value.trim() || "USA",
    tag: adminBizTag.value.trim() || "Business",
    icon: adminBizIcon.value.trim() || "⭐",
    desc: adminBizDesc.value.trim()
  };
  if(!data.name || !data.desc){ toast("Add business name and description"); return; }
  if(adminBizId.value){
    await updateDoc(doc(db, "businesses", adminBizId.value), data);
    toast("Business updated");
  } else {
    await addDoc(collection(db, "businesses"), {...data, createdAt:serverTimestamp()});
    toast("Business added");
  }
  clearBusinessForm();
}

function editEventAdmin(id){
  const e = events.find(x => x.id === id);
  if(!e) return;
  adminTab("events");
  adminEventId.value = e.id;
  adminEventTitle.value = e.title || "";
  adminEventDate.value = e.date || "";
  adminEventState.value = e.state || "";
  loadMajorCities();
  adminEventCity.value = e.city || "";
  adminEventPrice.value = e.price || "";
  adminEventIcon.value = e.icon || "";
  adminEventDesc.value = e.desc || "";
  eventFormTitle.textContent = "Edit Event";
  window.scrollTo({top:0, behavior:"smooth"});
}

function clearEventForm(){
  adminEventId.value = "";
  adminEventTitle.value = "";
  adminEventDate.value = "";
  adminEventState.value = "";
  loadMajorCities();
  adminEventPrice.value = "";
  adminEventIcon.value = "";
  adminEventDesc.value = "";
  eventFormTitle.textContent = "Add Event";
}

async function saveEventAdmin(){
  const title = adminEventTitle.value.trim();
  const date = adminEventDate.value;
  const state = adminEventState.value;
  const city = adminEventCity.value;
  const price = adminEventPrice.value.trim() || "RSVP";
  const icon = adminEventIcon.value.trim() || "🎟️";
  const desc = adminEventDesc.value.trim();
  if(!title || !date || !state || !city || !desc){
    toast("Please complete title, date, state, city, and description");
    return;
  }
  const data = {title,date,state,city,location: city + ", " + state,price,icon,desc};
  if(adminEventId.value){
    await updateDoc(doc(db, "events", adminEventId.value), data);
    toast("Event updated");
  } else {
    await addDoc(collection(db, "events"), {...data, createdAt:serverTimestamp()});
    toast("Event added");
  }
  clearEventForm();
}

function editGroupAdmin(id){
  const g = groups.find(x => x.id === id);
  if(!g) return;
  adminTab("groups");
  adminGroupId.value = g.id;
  adminGroupName.value = g.name || "";
  adminGroupCategory.value = g.category || "";
  adminGroupIcon.value = g.icon || "";
  adminGroupMembers.value = Number(g.members || 0);
  adminGroupDesc.value = g.desc || "";
  groupAdminFormTitle.textContent = "Edit Group";
  window.scrollTo({top:0, behavior:"smooth"});
}

function clearGroupAdminForm(){
  adminGroupId.value = "";
  adminGroupName.value = "";
  adminGroupCategory.value = "";
  adminGroupIcon.value = "";
  adminGroupMembers.value = "";
  adminGroupDesc.value = "";
  groupAdminFormTitle.textContent = "Add Group";
}

async function saveGroupAdmin(){
  const data = {
    name: adminGroupName.value.trim(),
    category: adminGroupCategory.value.trim() || "Community",
    icon: adminGroupIcon.value.trim() || "👥",
    members: Number(adminGroupMembers.value || 0),
    desc: adminGroupDesc.value.trim(),
    joined: false
  };
  if(!data.name || !data.desc){ toast("Add group name and description"); return; }
  if(adminGroupId.value){
    await updateDoc(doc(db, "groups", adminGroupId.value), data);
    toast("Group updated");
  } else {
    await addDoc(collection(db, "groups"), {...data, createdAt:serverTimestamp()});
    toast("Group added");
  }
  clearGroupAdminForm();
}

function editMarketAdmin(id){
  const l = listings.find(x => x.id === id);
  if(!l) return;
  adminTab("market");
  adminMarketId.value = l.id;
  adminMarketTitle.value = l.title || "";
  adminMarketCategory.value = l.category || "";
  adminMarketIcon.value = l.icon || "";
  adminMarketDesc.value = l.desc || "";
  marketFormTitle.textContent = "Edit Marketplace Listing";
  window.scrollTo({top:0, behavior:"smooth"});
}

function clearMarketForm(){
  adminMarketId.value = "";
  adminMarketTitle.value = "";
  adminMarketCategory.value = "";
  adminMarketIcon.value = "";
  adminMarketDesc.value = "";
  marketFormTitle.textContent = "Add Marketplace Listing";
}

async function saveMarketAdmin(){
  const data = {
    title: adminMarketTitle.value.trim(),
    category: adminMarketCategory.value.trim() || "General",
    icon: adminMarketIcon.value.trim() || "🛍️",
    desc: adminMarketDesc.value.trim()
  };
  if(!data.title || !data.desc){ toast("Add listing title and description"); return; }
  if(adminMarketId.value){
    await updateDoc(doc(db, "listings", adminMarketId.value), data);
    toast("Listing updated");
  } else {
    await addDoc(collection(db, "listings"), {...data, createdAt:serverTimestamp()});
    toast("Listing added");
  }
  clearMarketForm();
}

// Override old admin function names for compatibility
window.adminAddBusiness = saveBusinessAdmin;
window.adminAddEvent = saveEventAdmin;
Object.assign(window,{sendFriendRequest,acceptFriendRequest,acceptFriendByUser,renderMembers,
  adminTab,renderAdminLists,editBusinessAdmin,clearBusinessForm,saveBusinessAdmin,
  editEventAdmin,clearEventForm,saveEventAdmin,
  editGroupAdmin,clearGroupAdminForm,saveGroupAdmin,
  editMarketAdmin,clearMarketForm,saveMarketAdmin
});

await seedDatabase();
listen("businesses",data=>businesses=data);
listen("events",data=>events=data);
listen("groups",data=>groups=data);
listen("posts",data=>posts=data);
listen("listings",data=>listings=data);
listen("requests",data=>requests=data);
populateStates();
showPage("feed");