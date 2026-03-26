# Workflow — Kobik

*Wersja 1.0 • 26.03.2026*

---

## Początek sesji

1. **claude.ai** — otwórz nowy chat, Claude zrobi checklistę startową (git pull, TODO, memory)
2. Przejrzyj TODO.md — co 🔴, co 🟡, co 🔵
3. Zdecyduj: myślenie (claude.ai) czy mechanika (Code)

## Koniec sesji

1. W Code: `git status` → `git push`
2. W claude.ai: "koniec sesji" → Claude robi closing checklist (7 punktów)
3. Sprawdź czy TODO.md aktualny
4. Sprawdź czy zmienione pliki są w Project Files claude.ai

## Dwa narzędzia — kiedy którego

| Chcę... | Narzędzie |
|---------|-----------|
| Dyskutować architekturę / feature | **claude.ai** |
| Edytować pliki projektowe (TODO, PROGRESS, CLAUDE.md) | **Code** |
| Edytować kod aplikacji + deploy | **Lovable** |
| Quick fix / debug | **Code** |
| Planować duży feature | **claude.ai** → instrukcja → **Code** |

## Kluczowa zasada

**Code nie widzi memory claude.ai. Claude.ai nie widzi zmian w repo (chyba że git pull).**
Bridge = pliki w repo (TODO.md, handoffy, CLAUDE.md).

## Co automatyczne, co RĘCZNE

### Automatyczne
- ✅ Code czyta CLAUDE.md na starcie
- ✅ Code ładuje .claude/rules/ i .claude/skills/
- ✅ Git commit w trakcie pracy Code
- ✅ claude.ai robi git clone na starcie chatu
- ✅ Lovable auto-sync z GitHub (dwukierunkowy)

### RĘCZNE
- ⚠️ `git push` na końcu sesji Code
- ⚠️ Project Files update w claude.ai po edycji w Code
- ⚠️ Memory update w claude.ai po pracy w Code
- ⚠️ Pluginy Code: zainstaluj raz, potem działają automatycznie

## Po Code edycji — podmiana Project Files

1. Project Settings → Project knowledge
2. Usuń stary plik
3. Wrzuć nowy z repo

Pliki wymagające podmiany: TODO.md, PROGRESS.md, CLAUDE.md, KOBIK-PRODUCTS.md, INSTRUCTIONS.md (treść → Instructions) + pliki które Code zmienił.
Szybko: Finder → repo folder → drag & drop.

Specjalnie: `INSTRUCTIONS.md` → skopiuj TREŚĆ pliku (nie plik sam) i wklej w Project Settings → Instructions w claude.ai.

## Gdy coś poszło nie tak

| Problem | Co robić |
|---------|----------|
| Code zrobił bzdurę | `git diff <plik>` → `git checkout <plik>` |
| Code commitnął złe | `git log --oneline -5` → `git revert HEAD` |
| claude.ai nie widzi zmian z Code | Dodaj zmienione pliki do Project Files. Powiedz co się zmieniło |
| Lovable i repo się rozjechały | `git pull` w repo, sprawdź Lovable Settings → GitHub |
| Lovable deployment failed | Sprawdź build logs w Lovable, fix w Lovable editor |

## Komendy Code — ściągawka

| Komenda | Co robi |
|---------|---------|
| `/compact` | Kompresuj kontekst (oszczędza tokeny) |
| `/clear` | Wyczyść kontekst (nowy temat) |
| `git status` | Co nie commitowane |
| `git push` | Wypchnij zmiany |
| `git log --oneline -5` | Ostatnie 5 commitów |
| `claude plugin list` | Zainstalowane pluginy |

## Pluginy Code (zainstalowane)

- **Supabase** — SQL, database ops
- **TypeScript LSP** — type checking, code intelligence
- **GitHub** — repo management, PRs
- **CLAUDE.md Management** — audyt i utrzymanie CLAUDE.md
- **Commit Commands** — git commit/push/PR workflows
