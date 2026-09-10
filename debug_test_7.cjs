async function run() {
  const fileId = 'file-1789060829014-185';
  console.log('Fetching', fileId);
  const authRes = await fetch(`http://localhost:3000/api/storage/preview/${fileId}`, {
    headers: {
      Cookie: `userRole=Distributor; userOrg=${encodeURIComponent('Test Org B')}`
    }
  });
  console.log(authRes.status);
  const text = await authRes.text();
  console.log(text.substring(0,100));
}
run();
