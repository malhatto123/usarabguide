const defaults = {
  places:[
    {name:"Levant Table",type:"Lebanese • Syrian",city:"Northern Virginia",tag:"Restaurant",desc:"Modern Arab dining, shawarma, kebab, mezze, family platters and catering."},
    {name:"Cedar Sweets",type:"Kunafa • Baklava • Coffee",city:"Maryland",tag:"Dessert Café",desc:"Arabic sweets, coffee, party trays and premium desserts for events."},
    {name:"Nile Kitchen",type:"Egyptian Comfort Food",city:"Texas",tag:"Family Dining",desc:"Koshari, grilled meats, molokhia and weekend family specials."},
    {name:"Arab Realtor Network",type:"Real Estate Services",city:"USA",tag:"Professional",desc:"Arab-speaking real estate support for buyers, sellers and investors."},
    {name:"Immigration Law Office",type:"Legal Services",city:"Washington, DC",tag:"Legal",desc:"Visa, family immigration, business immigration and consultation services."},
    {name:"Arab Grocery Market",type:"Grocery • Halal Meat",city:"New Jersey",tag:"Market",desc:"Middle Eastern groceries, halal meat, spices, bread, olives and imported products."}
  ],
  events:[
    {title:"Arab Culture Night",date:"June 15",place:"Washington, DC",price:"$25",desc:"Music, food, dabke, vendors and a family-friendly cultural celebration."},
    {title:"Arab Business Mixer",date:"June 22",place:"Northern Virginia",price:"Free RSVP",desc:"Networking for founders, restaurants, service providers and professionals."},
    {title:"Family Soccer Meetup",date:"Every Saturday",place:"Herndon, VA",price:"$10",desc:"Community soccer games, kids activities and social gathering."},
    {title:"Arabic Music Evening",date:"July 3",place:"Maryland",price:"$35",desc:"Live music, dinner and an elegant community social night."}
  ],
  posts:[
    {name:"Maya A.",text:"Best Arabic bakery near Tysons? Looking for kunafa and baklava recommendations.",likes:18},
    {name:"Omar K.",text:"We are planning an Arab business networking event next month. Vendors welcome.",likes:31},
    {name:"Sarah M.",text:"New to the DC area and looking to meet Arab families and community groups.",likes:44}
  ],
  joins:[]
};

function getData(key){ return JSON.parse(localStorage.getItem("ua_"+key) || "null") || defaults[key]; }
function setData(key,val){ localStorage.setItem("ua_"+key, JSON.stringify(val)); }

let places=getData("places"), events=getData("events"), posts=getData("posts"), joins=getData("joins");
let isAdmin = sessionStorage.getItem("ua_admin")==="yes";

function go(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));document.getElementById(id).classList.add('active');document.getElementById('nav').classList.remove('show');scrollTo({top:0,behavior:'smooth'}); if(id==="admin") refreshAdmin();}
function toggleMenu(){document.getElementById('nav').classList.toggle('show')}

function render(){
  document.getElementById('cards').innerHTML=places.map((x,i)=>`<article class="card searchable" data-text="${Object.values(x).join(' ').toLowerCase()}"><span class="tag">${x.tag}</span><h3>${x.name}</h3><p class="meta">${x.type} • ${x.city}</p><p>${x.desc}</p><button onclick="alert('Profile page, reviews, menu and contact form will be connected in the next backend stage.')">View Details</button>${isAdmin?`<br><br><button class="danger smallBtn" onclick="deleteBusiness(${i})">Delete</button>`:""}</article>`).join('');
  document.getElementById('eventCards').innerHTML=events.map((x,i)=>`<article class="card searchable" data-text="${Object.values(x).join(' ').toLowerCase()}"><span class="tag">${x.price}</span><h3>${x.title}</h3><p class="meta">${x.date} • ${x.place}</p><p>${x.desc}</p><button onclick="alert('RSVP received in demo mode. Real ticketing will need payments/backend.')">Reserve / Tickets</button>${isAdmin?`<br><br><button class="danger smallBtn" onclick="deleteEvent(${i})">Delete</button>`:""}</article>`).join('');
  renderPosts();
  refreshAdmin();
}

function renderPosts(){
  document.getElementById('feed').innerHTML=posts.map((p,i)=>`<article class="feedItem"><div class="avatar">${(p.name||"M")[0]}</div><div><h3>${p.name}</h3><small>Community Member</small><p>${p.text}</p><div class="actions"><span onclick="like(${i})">❤️ ${p.likes}</span><span onclick="alert('Comments will be connected in the database stage.')">💬 Comment</span><span>↗ Share</span></div>${isAdmin?`<br><button class="danger smallBtn" onclick="deletePost(${i})">Delete Post</button>`:""}</div></article>`).join('');
}

function addPost(){const name=document.getElementById('name').value.trim()||'Community Member';const text=document.getElementById('post').value.trim();if(!text){alert('Please write a post first.');return}posts.unshift({name,text,likes:0});setData("posts",posts);document.getElementById('post').value='';render();}
function like(i){posts[i].likes++;setData("posts",posts);renderPosts();}
function submitJoin(){const name=joinName.value.trim(), email=joinEmail.value.trim(), city=joinCity.value.trim(), type=joinType.value;if(!name||!email){alert("Please add name and email.");return}joins.unshift({name,email,city,type,date:new Date().toLocaleString()});setData("joins",joins);joinName.value=joinEmail.value=joinCity.value="";alert("Thank you. Your request was submitted.");refreshAdmin();}
function filterCards(){const q=document.getElementById('search').value.toLowerCase();if(q.length>1){go('discover');setTimeout(()=>document.querySelectorAll('.searchable').forEach(c=>c.style.display=c.dataset.text.includes(q)?'block':'none'),50)}}

function adminLogin(){if(document.getElementById("adminPass").value==="admin123"){isAdmin=true;sessionStorage.setItem("ua_admin","yes");refreshAdmin();render();}else{alert("Wrong password. Use admin123 for this demo.")}}
function adminLogout(){isAdmin=false;sessionStorage.removeItem("ua_admin");refreshAdmin();render();}
function refreshAdmin(){
  const login=document.getElementById("adminLogin"), panel=document.getElementById("adminPanel");
  if(!login||!panel)return;
  login.classList.toggle("hidden",isAdmin);
  panel.classList.toggle("hidden",!isAdmin);
  if(!isAdmin)return;
  statPlaces.textContent=places.length; statEvents.textContent=events.length; statPosts.textContent=posts.length; statJoins.textContent=joins.length;
  joinRequests.innerHTML=joins.length?joins.map((j,i)=>`<div class="adminItem"><div><b>${j.name}</b><p>${j.email} • ${j.city} • ${j.type}</p><small>${j.date}</small></div><button class="danger smallBtn" onclick="deleteJoin(${i})">Delete</button></div>`).join(""):"<p>No join requests yet.</p>";
  adminPosts.innerHTML=posts.map((p,i)=>`<div class="adminItem"><div><b>${p.name}</b><p>${p.text}</p></div><button class="danger smallBtn" onclick="deletePost(${i})">Delete</button></div>`).join("");
}
function adminAddBusiness(){const obj={name:bizName.value.trim(),type:bizType.value.trim(),city:bizCity.value.trim(),tag:bizTag.value.trim()||"Business",desc:bizDesc.value.trim()}; if(!obj.name||!obj.desc){alert("Add business name and description.");return} places.unshift(obj); setData("places",places); bizName.value=bizType.value=bizCity.value=bizTag.value=bizDesc.value=""; render();}
function adminAddEvent(){const obj={title:eventTitle.value.trim(),date:eventDate.value.trim(),place:eventPlace.value.trim(),price:eventPrice.value.trim()||"RSVP",desc:eventDesc.value.trim()}; if(!obj.title||!obj.desc){alert("Add event title and description.");return} events.unshift(obj); setData("events",events); eventTitle.value=eventDate.value=eventPlace.value=eventPrice.value=eventDesc.value=""; render();}
function deleteBusiness(i){if(confirm("Delete this business?")){places.splice(i,1);setData("places",places);render();}}
function deleteEvent(i){if(confirm("Delete this event?")){events.splice(i,1);setData("events",events);render();}}
function deletePost(i){if(confirm("Delete this post?")){posts.splice(i,1);setData("posts",posts);render();}}
function deleteJoin(i){if(confirm("Delete this request?")){joins.splice(i,1);setData("joins",joins);refreshAdmin();}}
function resetAll(){if(confirm("Reset all demo content?")){["places","events","posts","joins"].forEach(k=>localStorage.removeItem("ua_"+k));places=defaults.places;events=defaults.events;posts=defaults.posts;joins=[];render();}}
render();
