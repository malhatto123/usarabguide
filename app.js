const seed = {
  users:[
    {name:"Maya A.",city:"Virginia",role:"Community Member"},
    {name:"Omar K.",city:"Maryland",role:"Event Organizer"},
    {name:"Sarah M.",city:"Washington, DC",role:"New Member"}
  ],
  posts:[
    {author:"Maya A.",city:"Virginia",type:"Recommendation",text:"Best Arabic bakery near Tysons? Looking for fresh kunafa and baklava recommendations.",likes:18,comments:7,saved:false,icon:"🍰"},
    {author:"Omar K.",city:"Maryland",type:"Event",text:"We are planning an Arab business networking event next month. Vendors and sponsors are welcome.",likes:31,comments:12,saved:false,icon:"🎟️"},
    {author:"Sarah M.",city:"Washington, DC",type:"Community",text:"New to the DC area and looking to meet Arab families, community groups, and Arabic-speaking service providers.",likes:44,comments:19,saved:false,icon:"👥"}
  ],
  places:[
    {name:"Levant Table",type:"Lebanese • Syrian",city:"Northern Virginia",tag:"Restaurant",desc:"Modern Arab dining, shawarma, kebab, mezze, family platters and catering.",icon:"🥙"},
    {name:"Cedar Sweets",type:"Kunafa • Baklava • Coffee",city:"Maryland",tag:"Dessert Café",desc:"Arabic sweets, coffee, party trays and premium desserts for events.",icon:"🍰"},
    {name:"Nile Kitchen",type:"Egyptian Comfort Food",city:"Texas",tag:"Family Dining",desc:"Koshari, grilled meats, molokhia and weekend family specials.",icon:"🍲"},
    {name:"Arab Realtor Network",type:"Real Estate Services",city:"USA",tag:"Professional",desc:"Arab-speaking real estate support for buyers, sellers and investors.",icon:"🏡"},
    {name:"Immigration Law Office",type:"Legal Services",city:"Washington, DC",tag:"Legal",desc:"Visa, family immigration, business immigration and consultation services.",icon:"⚖️"},
    {name:"Arab Grocery Market",type:"Grocery • Halal Meat",city:"New Jersey",tag:"Market",desc:"Middle Eastern groceries, halal meat, spices, bread, olives and imported products.",icon:"🛒"}
  ],
  events:[
    {title:"Arab Culture Night",date:"June 15",place:"Washington, DC",price:"$25",desc:"Music, food, dabke, vendors and a family-friendly cultural celebration.",icon:"🎶"},
    {title:"Arab Business Mixer",date:"June 22",place:"Northern Virginia",price:"Free RSVP",desc:"Networking for founders, restaurants, service providers and professionals.",icon:"🤝"},
    {title:"Family Soccer Meetup",date:"Every Saturday",place:"Herndon, VA",price:"$10",desc:"Community soccer games, kids activities and social gathering.",icon:"⚽"},
    {title:"Arabic Music Evening",date:"July 3",place:"Maryland",price:"$35",desc:"Live music, dinner and an elegant community social night.",icon:"🎵"}
  ],
  groups:[
    {name:"Arabs in Virginia",members:1240,desc:"Local events, restaurants, family recommendations and business support.",icon:"🏙️"},
    {name:"Arab Business Owners",members:870,desc:"Networking, promotion, partnerships and service provider introductions.",icon:"💼"},
    {name:"Students in USA",members:1560,desc:"Housing, school life, jobs, advice and support for Arab students.",icon:"🎓"},
    {name:"Arab Moms Community",members:940,desc:"Family support, schools, kids activities and local community questions.",icon:"👪"}
  ],
  market:[
    {title:"Restaurant hiring cashier",category:"Jobs",desc:"Part-time weekend cashier needed for Arabic restaurant.",icon:"💼"},
    {title:"Arabic tutor available",category:"Education",desc:"Arabic lessons for kids and adults, online or in person.",icon:"📚"},
    {title:"Room for rent near metro",category:"Housing",desc:"Clean room in family-friendly area near public transportation.",icon:"🏠"}
  ],
  joins:[]
};
function get(key){return JSON.parse(localStorage.getItem("ua6_"+key)||"null")||seed[key]}
function set(key,val){localStorage.setItem("ua6_"+key,JSON.stringify(val))}
let users=get("users"),posts=get("posts"),places=get("places"),events=get("events"),groups=get("groups"),market=get("market"),joins=get("joins");
let profile=JSON.parse(localStorage.getItem("ua6_profile")||"null")||{name:"Guest Member",city:"USA",role:"Community Explorer"};
let admin=sessionStorage.getItem("ua6_admin")==="yes";
let currentChat=0,postType="general";
const chats=[{name:"USArab Support",messages:["Welcome to USArab Guide. How can we help?"]},{name:"Arab Business Owners",messages:["New vendor opportunities will be posted here."]},{name:"Events Team",messages:["Ask about upcoming events and RSVP."]}];

function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2300)}
function route(id){document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));scrollTo({top:0,behavior:"smooth"});if(id==="admin") refreshAdmin();}
function renderProfile(){miniName.textContent=profile.name;miniRole.textContent=profile.role+" • "+profile.city;composerAvatar.textContent=(profile.name||"M")[0];}
function openAuth(){authModal.classList.add("show");authName.value=profile.name==="Guest Member"?"":profile.name;authCity.value=profile.city==="USA"?"":profile.city;authRole.value=profile.role==="Community Explorer"?"Community Member":profile.role}
function closeAuth(){authModal.classList.remove("show")}
function saveProfile(){profile={name:authName.value.trim()||"Community Member",city:authCity.value.trim()||"USA",role:authRole.value};localStorage.setItem("ua6_profile",JSON.stringify(profile));if(!users.find(u=>u.name===profile.name)){users.unshift(profile);set("users",users)}renderProfile();closeAuth();toast("Profile ready");renderAll();}
function createPost(){const text=postText.value.trim();if(!text){toast("Write something first");return}posts.unshift({author:profile.name,city:profile.city,type:postType,text,likes:0,comments:0,saved:false,icon:postType==="event"?"🎟️":postType==="recommendation"?"⭐":postType==="help"?"🤝":"💬"});set("posts",posts);postText.value="";renderPosts();toast("Post published")}
function renderPosts(){feedList.innerHTML=posts.map((p,i)=>`<article class="post searchable" data-text="${Object.values(p).join(" ").toLowerCase()}"><div class="postHead"><div class="avatar">${p.author[0]}</div><div><h3>${p.author}</h3><small>${p.city} • ${p.type}</small></div></div><p class="postText">${p.text}</p><div class="postImage">${p.icon}</div><div class="postActions"><button onclick="likePost(${i})">👍 ${p.likes}</button><button onclick="commentPost(${i})">💬 ${p.comments}</button><button onclick="savePost(${i})">${p.saved?"✅ Saved":"🔖 Save"}</button><button onclick="toast('Shared in demo mode')">↗ Share</button></div>${admin?`<button class="danger" onclick="deletePost(${i})">Delete Post</button>`:""}</article>`).join("")}
function likePost(i){posts[i].likes++;set("posts",posts);renderPosts()}
function commentPost(i){posts[i].comments++;set("posts",posts);renderPosts();toast("Comment added in demo mode")}
function savePost(i){posts[i].saved=!posts[i].saved;set("posts",posts);renderPosts()}
function renderPlaces(){placeGrid.innerHTML=places.map((x,i)=>`<article class="itemCard searchable" data-text="${Object.values(x).join(" ").toLowerCase()}"><div class="cover">${x.icon}</div><div class="itemBody"><span class="tag">${x.tag}</span><h3>${x.name}</h3><p class="meta">${x.type} • ${x.city}</p><p>${x.desc}</p><button onclick="toast('Profile page opens in next backend stage')">View Page</button>${admin?` <button class="danger" onclick="deletePlace(${i})">Delete</button>`:""}</div></article>`).join("")}
function renderEvents(){eventGrid.innerHTML=events.map((x,i)=>`<article class="itemCard searchable" data-text="${Object.values(x).join(" ").toLowerCase()}"><div class="cover">${x.icon}</div><div class="itemBody"><span class="tag">${x.price}</span><h3>${x.title}</h3><p class="meta">${x.date} • ${x.place}</p><p>${x.desc}</p><button onclick="toast('RSVP saved in demo mode')">RSVP / Tickets</button>${admin?` <button class="danger" onclick="deleteEvent(${i})">Delete</button>`:""}</div></article>`).join("")}
function renderGroups(){groupGrid.innerHTML=groups.map((g,i)=>`<article class="itemCard searchable" data-text="${Object.values(g).join(" ").toLowerCase()}"><div class="cover">${g.icon}</div><div class="itemBody"><span class="tag">${g.members} members</span><h3>${g.name}</h3><p>${g.desc}</p><button onclick="toast('Joined group in demo mode')">Join Group</button></div></article>`).join("")}
function renderMarket(){marketGrid.innerHTML=market.map((m,i)=>`<article class="itemCard searchable" data-text="${Object.values(m).join(" ").toLowerCase()}"><div class="cover">${m.icon}</div><div class="itemBody"><span class="tag">${m.category}</span><h3>${m.title}</h3><p>${m.desc}</p><button onclick="toast('Contact seller in demo mode')">Contact</button>${admin?` <button class="danger" onclick="deleteMarket(${i})">Delete</button>`:""}</div></article>`).join("")}
function addMarket(){const title=marketTitle.value.trim(),category=marketCategory.value.trim()||"General",desc=marketDesc.value.trim();if(!title||!desc){toast("Add title and description");return}market.unshift({title,category,desc,icon:"🛍️"});set("market",market);marketTitle.value=marketCategory.value=marketDesc.value="";renderMarket();toast("Listing published")}
function renderSidebars(){suggestGroups.innerHTML=groups.slice(0,3).map(g=>`<div class="suggestItem"><div class="suggestIcon">${g.icon}</div><div><b>${g.name}</b><br><small>${g.members} members</small></div></div>`).join("");suggestEvents.innerHTML=events.slice(0,3).map(e=>`<div class="suggestItem"><div class="suggestIcon">${e.icon}</div><div><b>${e.title}</b><br><small>${e.date}</small></div></div>`).join("")}
function joinRequest(){const name=joinName.value.trim(),email=joinEmail.value.trim();if(!name||!email){toast("Add name and email");return}joins.unshift({name,email,date:new Date().toLocaleString()});set("joins",joins);joinName.value=joinEmail.value="";toast("Join request submitted");refreshAdmin();}
function renderChats(){chatList.innerHTML=chats.map((c,i)=>`<div class="chatPerson" onclick="openChat(${i})"><b>${c.name}</b><br><small>${c.messages[c.messages.length-1]}</small></div>`).join("");openChat(currentChat)}
function openChat(i){currentChat=i;chatTitle.textContent=chats[i].name;chatMessages.innerHTML=chats[i].messages.map((m,idx)=>`<div class="bubble ${idx%2?'me':''}">${m}</div>`).join("")}
function sendMessage(){const msg=chatInput.value.trim();if(!msg)return;chats[currentChat].messages.push(msg);chatInput.value="";openChat(currentChat);toast("Message saved locally")}
function searchEverything(){const q=globalSearch.value.toLowerCase();document.querySelectorAll(".searchable").forEach(el=>{el.style.display=!q||el.dataset.text.includes(q)?"":"none"})}
function loginAdmin(){if(adminPassword.value==="admin123"){admin=true;sessionStorage.setItem("ua6_admin","yes");refreshAdmin();renderAll();toast("Admin unlocked")}else toast("Wrong password")}
function logoutAdmin(){admin=false;sessionStorage.removeItem("ua6_admin");refreshAdmin();renderAll()}
function refreshAdmin(){adminLock.classList.toggle("hidden",admin);adminApp.classList.toggle("hidden",!admin);if(!admin)return;statUsers.textContent=users.length;statPosts.textContent=posts.length;statPlaces.textContent=places.length;statEvents.textContent=events.length;statJoins.textContent=joins.length;renderAdminOverview();adminTab("overview")}
function adminTab(tab){["Overview","AddPlace","AddEvent","Requests","Moderation"].forEach(x=>document.getElementById("admin"+x).classList.add("hidden"));document.getElementById("admin"+tab[0].toUpperCase()+tab.slice(1)).classList.remove("hidden")}
function renderAdminOverview(){adminOverview.innerHTML=`<h3>Platform Summary</h3><div class="adminRow"><div><b>Current profile</b><p>${profile.name} • ${profile.role}</p></div></div><div class="adminRow"><div><b>Storage mode</b><p>Browser/local demo storage. Firebase is required for real public shared database.</p></div></div>`;adminRequests.innerHTML=`<h3>Join Requests</h3>`+(joins.length?joins.map((j,i)=>`<div class="adminRow"><div><b>${j.name}</b><p>${j.email} • ${j.date}</p></div><button class="danger" onclick="deleteJoin(${i})">Delete</button></div>`).join(""):"<p>No requests yet.</p>");adminModeration.innerHTML=`<h3>Moderate Posts</h3>`+posts.map((p,i)=>`<div class="adminRow"><div><b>${p.author}</b><p>${p.text}</p></div><button class="danger" onclick="deletePost(${i})">Delete</button></div>`).join("")}
function addPlaceAdmin(){const obj={name:aPlaceName.value.trim(),type:aPlaceType.value.trim(),city:aPlaceCity.value.trim(),tag:aPlaceTag.value.trim()||"Business",desc:aPlaceDesc.value.trim(),icon:"⭐"};if(!obj.name||!obj.desc){toast("Add name and description");return}places.unshift(obj);set("places",places);aPlaceName.value=aPlaceType.value=aPlaceCity.value=aPlaceTag.value=aPlaceDesc.value="";renderAll();toast("Business added")}
function addEventAdmin(){const obj={title:aEventTitle.value.trim(),date:aEventDate.value.trim(),place:aEventPlace.value.trim(),price:aEventPrice.value.trim()||"RSVP",desc:aEventDesc.value.trim(),icon:"🎟️"};if(!obj.title||!obj.desc){toast("Add title and description");return}events.unshift(obj);set("events",events);aEventTitle.value=aEventDate.value=aEventPlace.value=aEventPrice.value=aEventDesc.value="";renderAll();toast("Event added")}
function deletePost(i){if(confirm("Delete this post?")){posts.splice(i,1);set("posts",posts);renderAll()}}
function deletePlace(i){if(confirm("Delete this place?")){places.splice(i,1);set("places",places);renderAll()}}
function deleteEvent(i){if(confirm("Delete this event?")){events.splice(i,1);set("events",events);renderAll()}}
function deleteMarket(i){if(confirm("Delete this listing?")){market.splice(i,1);set("market",market);renderAll()}}
function deleteJoin(i){joins.splice(i,1);set("joins",joins);refreshAdmin()}
function renderAll(){renderProfile();renderPosts();renderPlaces();renderEvents();renderGroups();renderMarket();renderSidebars();renderChats();if(admin)refreshAdmin()}
renderAll();route("home");
