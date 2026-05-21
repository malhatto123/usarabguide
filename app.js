const defaultData = {
  businesses: [
    {name:"Levant Table", type:"Lebanese • Syrian", city:"Northern Virginia", desc:"Modern Arab dining, shawarma, kebab, mezze, family platters and catering.", icon:"🥙", tag:"Restaurant"},
    {name:"Cedar Sweets", type:"Kunafa • Baklava • Coffee", city:"Maryland", desc:"Arabic sweets, coffee, party trays and premium desserts for events.", icon:"🍰", tag:"Dessert Café"},
    {name:"Nile Kitchen", type:"Egyptian Comfort Food", city:"Texas", desc:"Koshari, grilled meats, molokhia and weekend family specials.", icon:"🍲", tag:"Family Dining"},
    {name:"Arab Realtor Network", type:"Real Estate", city:"USA", desc:"Arab-speaking real estate support for buyers, sellers and investors.", icon:"🏡", tag:"Professional"},
    {name:"Immigration Law Office", type:"Legal Services", city:"Washington, DC", desc:"Visa, family immigration, business immigration and consultation services.", icon:"⚖️", tag:"Legal"},
    {name:"Arab Grocery Market", type:"Grocery • Halal Meat", city:"New Jersey", desc:"Middle Eastern groceries, halal meat, spices, bread, olives and imported products.", icon:"🛒", tag:"Market"}
  ],
  events: [
    {title:"Arab Culture Night", date:"June 15", location:"Washington, DC", price:"$25", desc:"Music, food, dabke, vendors and a family-friendly cultural celebration.", icon:"🎶"},
    {title:"Arab Business Mixer", date:"June 22", location:"Northern Virginia", price:"Free RSVP", desc:"Networking for founders, restaurants, service providers and professionals.", icon:"🤝"},
    {title:"Family Soccer Meetup", date:"Every Saturday", location:"Herndon, VA", price:"$10", desc:"Community soccer games, kids activities and social gathering.", icon:"⚽"},
    {title:"Arabic Music Evening", date:"July 3", location:"Maryland", price:"$35", desc:"Live music, dinner and an elegant community social night.", icon:"🎵"}
  ],
  groups: [
    {name:"Arabs in Virginia", members:"1,240", desc:"Local events, restaurants, family recommendations and business support.", icon:"🏙️"},
    {name:"Arab Business Owners", members:"870", desc:"Networking, promotion, partnerships and service provider introductions.", icon:"💼"},
    {name:"Students in USA", members:"1,560", desc:"Housing, school life, jobs, advice and support for Arab students.", icon:"🎓"},
    {name:"Arab Moms Community", members:"940", desc:"Family support, schools, kids activities and local community questions.", icon:"👪"}
  ],
  posts: [
    {name:"Maya A.", text:"Best Arabic bakery near Tysons? Looking for fresh kunafa and baklava recommendations.", likes:18, comments:7, icon:"🍰"},
    {name:"Omar K.", text:"We are planning an Arab business networking event next month. Vendors and sponsors are welcome.", likes:31, comments:12, icon:"🎟️"},
    {name:"Sarah M.", text:"New to the DC area and looking to meet Arab families, community groups, and Arabic-speaking service providers.", likes:44, comments:19, icon:"👥"}
  ],
  listings: [
    {title:"Restaurant hiring cashier", category:"Jobs", desc:"Part-time weekend cashier needed for Arabic restaurant.", icon:"💼"},
    {title:"Arabic tutor available", category:"Education", desc:"Arabic lessons for kids and adults, online or in person.", icon:"📚"},
    {title:"Room for rent near metro", category:"Housing", desc:"Clean room in family-friendly area near public transportation.", icon:"🏠"}
  ],
  requests: []
};

function load(key){
  const saved = localStorage.getItem("usarab_v7_" + key);
  return saved ? JSON.parse(saved) : defaultData[key];
}
function save(key, value){
  localStorage.setItem("usarab_v7_" + key, JSON.stringify(value));
}

let businesses = load("businesses");
let events = load("events");
let groups = load("groups");
let posts = load("posts");
let listings = load("listings");
let requests = load("requests");
let adminOn = sessionStorage.getItem("usarab_admin") === "yes";

function toast(message){
  const box = document.getElementById("toast");
  box.textContent = message;
  box.classList.add("show");
  setTimeout(() => box.classList.remove("show"), 2200);
}

function toggleMenu(){
  document.getElementById("mainMenu").classList.toggle("show");
}

function showPage(pageId){
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");
  document.querySelectorAll("nav button").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll("nav button").forEach(btn => {
    if(btn.textContent.toLowerCase().includes(pageId)) btn.classList.add("active");
  });
  document.getElementById("mainMenu").classList.remove("show");
  window.scrollTo({top:0, behavior:"smooth"});
  if(pageId === "admin") refreshAdmin();
}

function renderBusinesses(){
  document.getElementById("businessList").innerHTML = businesses.map((b, i) => `
    <article class="card searchable" data-search="${Object.values(b).join(" ").toLowerCase()}">
      <div class="card-icon">${b.icon || "⭐"}</div>
      <span class="tag">${b.tag || "Business"}</span>
      <h3>${b.name}</h3>
      <p class="meta">${b.type} • ${b.city}</p>
      <p>${b.desc}</p>
      <button onclick="toast('Business profile opened in demo mode')">View Details</button>
      ${adminOn ? `<button class="danger" onclick="deleteBusiness(${i})">Delete</button>` : ""}
    </article>
  `).join("");
}

function renderEvents(){
  document.getElementById("eventList").innerHTML = events.map((e, i) => `
    <article class="card searchable" data-search="${Object.values(e).join(" ").toLowerCase()}">
      <div class="card-icon">${e.icon || "🎟️"}</div>
      <span class="tag">${e.price}</span>
      <h3>${e.title}</h3>
      <p class="meta">${e.date} • ${e.location}</p>
      <p>${e.desc}</p>
      <button onclick="toast('RSVP saved in demo mode')">RSVP / Tickets</button>
      ${adminOn ? `<button class="danger" onclick="deleteEvent(${i})">Delete</button>` : ""}
    </article>
  `).join("");
}

function renderGroups(){
  document.getElementById("groupList").innerHTML = groups.map(g => `
    <article class="card searchable" data-search="${Object.values(g).join(" ").toLowerCase()}">
      <div class="card-icon">${g.icon}</div>
      <span class="tag">${g.members} members</span>
      <h3>${g.name}</h3>
      <p>${g.desc}</p>
      <button onclick="toast('Joined group in demo mode')">Join Group</button>
    </article>
  `).join("");
}

function renderPosts(){
  document.getElementById("postList").innerHTML = posts.map((p, i) => `
    <article class="post searchable" data-search="${Object.values(p).join(" ").toLowerCase()}">
      <div class="post-head">
        <div class="avatar">${p.name.charAt(0).toUpperCase()}</div>
        <div>
          <h3>${p.name}</h3>
          <small>Community Member</small>
        </div>
      </div>
      <p class="post-text">${p.text}</p>
      <div class="post-media">${p.icon || "💬"}</div>
      <div class="post-actions">
        <button onclick="likePost(${i})">👍 ${p.likes}</button>
        <button onclick="commentPost(${i})">💬 ${p.comments}</button>
        <button onclick="toast('Saved in demo mode')">🔖 Save</button>
        <button onclick="toast('Shared in demo mode')">↗ Share</button>
      </div>
      ${adminOn ? `<button class="danger" onclick="deletePost(${i})">Delete Post</button>` : ""}
    </article>
  `).join("");
}

function renderMarket(){
  document.getElementById("marketList").innerHTML = listings.map((l, i) => `
    <article class="card searchable" data-search="${Object.values(l).join(" ").toLowerCase()}">
      <div class="card-icon">${l.icon || "🛍️"}</div>
      <span class="tag">${l.category}</span>
      <h3>${l.title}</h3>
      <p>${l.desc}</p>
      <button onclick="toast('Contact request sent in demo mode')">Contact</button>
      ${adminOn ? `<button class="danger" onclick="deleteListing(${i})">Delete</button>` : ""}
    </article>
  `).join("");
}

function addPost(){
  const name = document.getElementById("postName").value.trim() || "Community Member";
  const text = document.getElementById("postText").value.trim();
  if(!text){ toast("Please write a post first"); return; }
  posts.unshift({name, text, likes:0, comments:0, icon:"💬"});
  save("posts", posts);
  document.getElementById("postText").value = "";
  renderPosts();
  refreshAdmin();
  toast("Post published");
}

function likePost(i){
  posts[i].likes++;
  save("posts", posts);
  renderPosts();
}
function commentPost(i){
  posts[i].comments++;
  save("posts", posts);
  renderPosts();
  toast("Comment added in demo mode");
}

function addListing(){
  const title = document.getElementById("listingTitle").value.trim();
  const category = document.getElementById("listingCategory").value.trim() || "General";
  const desc = document.getElementById("listingDesc").value.trim();
  if(!title || !desc){ toast("Please add title and description"); return; }
  listings.unshift({title, category, desc, icon:"🛍️"});
  save("listings", listings);
  document.getElementById("listingTitle").value = "";
  document.getElementById("listingCategory").value = "";
  document.getElementById("listingDesc").value = "";
  renderMarket();
  toast("Listing added");
}

function submitJoin(){
  const name = document.getElementById("joinName").value.trim();
  const email = document.getElementById("joinEmail").value.trim();
  const city = document.getElementById("joinCity").value.trim();
  const type = document.getElementById("joinType").value;
  if(!name || !email){ toast("Please add name and email"); return; }
  requests.unshift({name, email, city, type, date:new Date().toLocaleString()});
  save("requests", requests);
  document.getElementById("joinName").value = "";
  document.getElementById("joinEmail").value = "";
  document.getElementById("joinCity").value = "";
  toast("Join request submitted");
  refreshAdmin();
}

function loginAdmin(){
  const password = document.getElementById("adminPassword").value;
  if(password === "admin123"){
    adminOn = true;
    sessionStorage.setItem("usarab_admin", "yes");
    refreshAdmin();
    renderAll();
    toast("Admin activated");
  } else {
    toast("Wrong password");
  }
}
function logoutAdmin(){
  adminOn = false;
  sessionStorage.removeItem("usarab_admin");
  refreshAdmin();
  renderAll();
  toast("Admin logged out");
}
function refreshAdmin(){
  const login = document.getElementById("adminLogin");
  const panel = document.getElementById("adminPanel");
  if(!login || !panel) return;
  login.classList.toggle("hidden", adminOn);
  panel.classList.toggle("hidden", !adminOn);
  if(!adminOn) return;

  document.getElementById("statBusinesses").textContent = businesses.length;
  document.getElementById("statEvents").textContent = events.length;
  document.getElementById("statPosts").textContent = posts.length;
  document.getElementById("statRequests").textContent = requests.length;

  document.getElementById("adminRequests").innerHTML = requests.length ? requests.map((r, i) => `
    <div class="admin-row">
      <div><b>${r.name}</b><p>${r.email} • ${r.city} • ${r.type}</p><small>${r.date}</small></div>
      <button class="danger" onclick="deleteRequest(${i})">Delete</button>
    </div>
  `).join("") : "<p>No join requests yet.</p>";

  document.getElementById("adminPosts").innerHTML = posts.map((p, i) => `
    <div class="admin-row">
      <div><b>${p.name}</b><p>${p.text}</p></div>
      <button class="danger" onclick="deletePost(${i})">Delete</button>
    </div>
  `).join("");
}

function adminAddBusiness(){
  const name = document.getElementById("adminBizName").value.trim();
  const type = document.getElementById("adminBizType").value.trim();
  const city = document.getElementById("adminBizCity").value.trim();
  const desc = document.getElementById("adminBizDesc").value.trim();
  if(!name || !desc){ toast("Add business name and description"); return; }
  businesses.unshift({name, type:type || "Business", city:city || "USA", desc, icon:"⭐", tag:"Business"});
  save("businesses", businesses);
  document.getElementById("adminBizName").value = "";
  document.getElementById("adminBizType").value = "";
  document.getElementById("adminBizCity").value = "";
  document.getElementById("adminBizDesc").value = "";
  renderBusinesses();
  refreshAdmin();
  toast("Business added");
}

function adminAddEvent(){
  const title = document.getElementById("adminEventTitle").value.trim();
  const date = document.getElementById("adminEventDate").value.trim();
  const location = document.getElementById("adminEventLocation").value.trim();
  const price = document.getElementById("adminEventPrice").value.trim();
  const desc = document.getElementById("adminEventDesc").value.trim();
  if(!title || !desc){ toast("Add event title and description"); return; }
  events.unshift({title, date:date || "Coming soon", location:location || "USA", price:price || "RSVP", desc, icon:"🎟️"});
  save("events", events);
  document.getElementById("adminEventTitle").value = "";
  document.getElementById("adminEventDate").value = "";
  document.getElementById("adminEventLocation").value = "";
  document.getElementById("adminEventPrice").value = "";
  document.getElementById("adminEventDesc").value = "";
  renderEvents();
  refreshAdmin();
  toast("Event added");
}

function deleteBusiness(i){ if(confirm("Delete this business?")){ businesses.splice(i,1); save("businesses", businesses); renderBusinesses(); refreshAdmin(); } }
function deleteEvent(i){ if(confirm("Delete this event?")){ events.splice(i,1); save("events", events); renderEvents(); refreshAdmin(); } }
function deletePost(i){ if(confirm("Delete this post?")){ posts.splice(i,1); save("posts", posts); renderPosts(); refreshAdmin(); } }
function deleteListing(i){ if(confirm("Delete this listing?")){ listings.splice(i,1); save("listings", listings); renderMarket(); } }
function deleteRequest(i){ requests.splice(i,1); save("requests", requests); refreshAdmin(); }

function searchItems(){
  const q = document.getElementById("searchInput").value.toLowerCase();
  if(q.length > 1) showPage("discover");
  setTimeout(() => {
    document.querySelectorAll(".searchable").forEach(item => {
      const text = item.dataset.search || "";
      item.style.display = !q || text.includes(q) ? "" : "none";
    });
  }, 80);
}

function renderAll(){
  renderBusinesses();
  renderEvents();
  renderGroups();
  renderPosts();
  renderMarket();
  refreshAdmin();
}
renderAll();
