// EdgeVault - State & Main App Entry

// STATE
let state = {
  user: null,
  trades: [...INIT_TRADES],
  journal: [...INIT_JOURNAL],
  rules: [...INIT_RULES],
  checklist: [...INIT_CHECKLIST],
  currentPage: 'dashboard',
  tradeFilter: {outcome:'ALL', setup:'ALL'},
  chartInstances: {},
  formState: {dir:'BUY', outcome:'WIN', emotion:'Calm', rating:4, screenshots:{htf:null,mtf:null,ltf:null}},
  pendingSSTarget: null,
  obStep: 0,
  journalEmotion: 'Calm',
  profilePic: null,
};

const MAX_PROFILE_PIC_SIZE = 1024 * 1024;

function compressImage(dataUrl, maxWidth, maxHeight, quality, callback){
  const img = new Image();
  img.onload = function(){
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;
    if(width > maxWidth){
      height = Math.round(height * maxWidth / width);
      width = maxWidth;
    }
    if(height > maxHeight){
      width = Math.round(width * maxHeight / height);
      height = maxHeight;
    }
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    callback(canvas.toDataURL('image/jpeg', quality));
  };
  img.src = dataUrl;
}

function handleProfilePic(event){
  const file = event.target.files[0];
  if(!file) return;
  if(file.size > MAX_PROFILE_PIC_SIZE){
    alert('Image too large. Please use an image under 1MB.');
    event.target.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e){
    const dataUrl = e.target.result;
    compressImage(dataUrl, 200, 200, 0.7, function(compressed){
      state.profilePic = compressed;
      const img = document.getElementById('profile-pic-img');
      const avatar = document.getElementById('profile-avatar');
      if(img){
        img.src = compressed;
        img.style.display = 'block';
      }
      if(avatar){
        avatar.style.background = 'none';
        avatar.style.border = '2px solid var(--border)';
      }
      localStorage.setItem('ev_profile_pic', compressed);
    });
  };
  reader.readAsDataURL(file);
  event.target.value = '';
}

function loadProfilePic(){
  const saved = localStorage.getItem('ev_profile_pic');
  if(saved){
    state.profilePic = saved;
    const img = document.getElementById('profile-pic-img');
    const avatar = document.getElementById('profile-avatar');
    if(img){
      img.src = saved;
      img.style.display = 'block';
    }
    if(avatar){
      avatar.style.background = 'none';
      avatar.style.border = '2px solid var(--border)';
    }
  }
}