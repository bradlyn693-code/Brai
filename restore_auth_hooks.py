from pathlib import Path
path = Path('/home/ubuntu/couple-hearts/client/src/App.tsx')
text = path.read_text()
needle = 'function useCoins() { return getUserCoins(useCurrentUser()); }'
restore = '''function hasChatAccess(user: User | null) { return user?.premium === true || getUserCoins(user) > 0; }
function useCurrentUser() {
  const [user, setUser] = useState<User | null>(() => getUser());
  useEffect(() => {
    const sync = () => setUser(getUser());
    window.addEventListener("couplehearts:coins", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("couplehearts:coins", sync); window.removeEventListener("storage", sync); };
  }, []);
  return user;
}
function useCoins() { return getUserCoins(useCurrentUser()); }'''
if needle not in text:
    raise SystemExit('useCoins insertion point not found')
path.write_text(text.replace(needle, restore, 1))
print('restored shared auth hooks')
