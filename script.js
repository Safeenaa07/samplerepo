const ls = {
  users: JSON.parse(localStorage.getItem("micro_users") || "[]"),
  posts: JSON.parse(localStorage.getItem("micro_posts") || "[]"),
  current: localStorage.getItem("micro_currentUser") || null,
};
function save() {
  localStorage.setItem("micro_users", JSON.stringify(ls.users));
  localStorage.setItem("micro_posts", JSON.stringify(ls.posts));
  if (ls.current) localStorage.setItem("micro_currentUser", ls.current);
  else localStorage.removeItem("micro_currentUser");
}
const el = {
  usernameInput: document.getElementById("usernameInput"),
  signupBtn: document.getElementById("signupBtn"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  currentUserWrap: document.getElementById("currentUserWrap"),
  currentUserName: document.getElementById("currentUserName"),
  peopleList: document.getElementById("peopleList"),
  postText: document.getElementById("postText"),
  postBtn: document.getElementById("postBtn"),
  charCount: document.getElementById("charCount"),
  posts: document.getElementById("posts"),
  profileName: document.getElementById("profileName"),
  profileFollowWrap: document.getElementById("profileFollowWrap"),
  profileStats: document.getElementById("profileStats"),
  viewFeedBtn: document.getElementById("viewFeedBtn"),
  viewAllBtn: document.getElementById("viewAllBtn"),
  feedTitle: document.getElementById("feedTitle"),
};
function findUser(name) {
  return ls.users.find((u) => u.username === name);
}
function signup() {
  const name = el.usernameInput.value.trim();
  if (!name) return alert("Enter username");
  if (findUser(name)) return alert("Username exists");
  ls.users.push({ username: name, following: [] });
  ls.current = name;
  save();
  renderAuth();
  renderPeople();
  renderFeed();
}
function login() {
  const name = el.usernameInput.value.trim();
  if (!name) return alert("Enter username");
  if (!findUser(name)) return alert("No such user");
  ls.current = name;
  save();
  renderAuth();
  renderPeople();
  renderFeed();
}
function logout() {
  ls.current = null;
  save();
  renderAuth();
  renderFeed();
}
function createPost() {
  if (!ls.current) return alert("Login first");
  const text = el.postText.value.trim();
  if (!text) return;
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  ls.posts.unshift({
    id,
    author: ls.current,
    content: text,
    ts: new Date().toISOString(),
  });
  el.postText.value = "";
  el.charCount.textContent = "0/280";
  save();
  renderFeed();
  renderProfile(ls.current);
}
function toggleFollow(target) {
  if (!ls.current) return alert("Login first");
  if (ls.current === target) return;
  const me = findUser(ls.current);
  if (me.following.includes(target)) {
    me.following = me.following.filter((x) => x !== target);
  } else {
    me.following.push(target);
  }
  save();
  renderPeople();
  renderProfile(target);
  renderFeed();
}
function viewProfile(name) {
  renderProfile(name);
}
function timeAgo(iso) {
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}
function renderAuth() {
  if (ls.current) {
    el.currentUserWrap.classList.remove("hidden");
    el.currentUserName.textContent = ls.current;
    el.usernameInput.classList.add("hidden");
    el.signupBtn.classList.add("hidden");
    el.loginBtn.classList.add("hidden");
  } else {
    el.currentUserWrap.classList.add("hidden");
    el.usernameInput.classList.remove("hidden");
    el.signupBtn.classList.remove("hidden");
    el.loginBtn.classList.remove("hidden");
  }
}
function renderPeople() {
  el.peopleList.innerHTML = "";
  ls.users
    .slice()
    .sort((a, b) => a.username.localeCompare(b.username))
    .forEach((u) => {
      const li = document.createElement("li");
      const nameSpan = document.createElement("span");
      nameSpan.textContent = u.username;
      nameSpan.style.cursor = "pointer";
      nameSpan.onclick = () => viewProfile(u.username);
      const btn = document.createElement("button");
      if (!ls.current || ls.current === u.username) {
        btn.textContent = "—";
        btn.disabled = true;
      } else {
        const me = findUser(ls.current);
        if (me && me.following.includes(u.username))
          btn.textContent = "Unfollow";
        else btn.textContent = "Follow";
        btn.onclick = () => toggleFollow(u.username);
      }
      li.appendChild(nameSpan);
      li.appendChild(btn);
      el.peopleList.appendChild(li);
    });
}
function renderPosts(list) {
  el.posts.innerHTML = "";
  if (list.length === 0) {
    el.posts.innerHTML =
      '<div style="color:var(--muted);padding:12px">No posts yet</div>';
    return;
  }
  list.forEach((p) => {
    const div = document.createElement("div");
    div.className = "post";
    const meta = document.createElement("div");
    meta.className = "meta";
    const author = document.createElement("div");
    author.className = "author";
    author.textContent = p.author;
    author.style.cursor = "pointer";
    author.onclick = () => viewProfile(p.author);
    const time = document.createElement("div");
    time.className = "time";
    time.textContent = timeAgo(p.ts);
    meta.appendChild(author);
    meta.appendChild(time);
    const text = document.createElement("div");
    text.className = "text";
    text.textContent = p.content;
    div.appendChild(meta);
    div.appendChild(text);
    el.posts.appendChild(div);
  });
}
function renderFeed() {
  if (el.viewAllBtn.classList.contains("active")) {
    el.feedTitle.textContent = "All Posts";
    renderPosts(ls.posts);
    return;
  }
  el.feedTitle.textContent = ls.current ? "Your Feed" : "Public Feed";
  if (!ls.current) return renderPosts(ls.posts);
  const me = findUser(ls.current);
  const allowed = new Set([ls.current, ...(me ? me.following : [])]);
  const feed = ls.posts.filter((p) => allowed.has(p.author));
  renderPosts(feed);
}
function renderProfile(name) {
  const u = findUser(name);
  if (!u) {
    el.profileName.textContent = "Not found";
    el.profileFollowWrap.innerHTML = "";
    el.profileStats.innerHTML = "";
    return;
  }
  el.profileName.textContent = u.username;
  el.profileStats.innerHTML = `Followers: ${
    ls.users.filter((x) => x.following.includes(u.username)).length
  } · Following: ${u.following.length}`;
  el.profileFollowWrap.innerHTML = "";
  if (ls.current && ls.current !== u.username) {
    const btn = document.createElement("button");
    const me = findUser(ls.current);
    if (me.following.includes(u.username)) btn.textContent = "Unfollow";
    else btn.textContent = "Follow";
    btn.onclick = () => toggleFollow(u.username);
    el.profileFollowWrap.appendChild(btn);
  } else {
    el.profileFollowWrap.innerHTML = "";
  }
  const userPosts = ls.posts.filter((p) => p.author === u.username);
  renderPosts(userPosts);
}
el.signupBtn.addEventListener("click", signup);
el.loginBtn.addEventListener("click", login);
el.logoutBtn.addEventListener("click", logout);
el.postBtn.addEventListener("click", createPost);
el.postText.addEventListener("input", (e) => {
  el.charCount.textContent = `${e.target.value.length}/280`;
});
el.viewFeedBtn.addEventListener("click", () => {
  el.viewAllBtn.classList.remove("active");
  el.viewFeedBtn.classList.add("active");
  renderFeed();
});
el.viewAllBtn.addEventListener("click", () => {
  el.viewFeedBtn.classList.remove("active");
  el.viewAllBtn.classList.add("active");
  renderFeed();
});
(function init() {
  if (ls.users.length === 0) {
    ls.users.push({ username: "alice", following: ["bob"] });
    ls.users.push({ username: "bob", following: [] });
    ls.posts.push({
      id: "p1",
      author: "bob",
      content: "Hello from Bob!",
      ts: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    });
    ls.posts.push({
      id: "p2",
      author: "alice",
      content: "Welcome to Microblog demo.",
      ts: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    });
  }
  save();
  renderAuth();
  renderPeople();
  renderFeed();
  if (ls.current) renderProfile(ls.current);
})();
