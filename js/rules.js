(function (global) {
  function leaf(path, reason, strength) {
    return {
      home: path,
      source: "rule",
      strength: strength || "strong",
      reason: reason,
    };
  }

  function findPath(code) {
    const found = global.FilingMap.MANUAL_LEAVES.find(function (l) {
      return l.code === code;
    });
    if (!found) throw new Error("Unknown Manual code: " + code);
    return found.path;
  }

  function extensionOf(name) {
    const i = name.lastIndexOf(".");
    return i >= 0 ? name.slice(i).toLowerCase() : "";
  }

  function suggestFromRules(input) {
    const text = (input.name + " " + (input.description || "")).toLowerCase();
    const ext = extensionOf(input.name);

    if (
      /\b(readme|thumbnail|thumbs\.db|\.ds_store|desktop\.ini)\b/i.test(text) ||
      /^(readme|thumbnail)/i.test(input.name)
    ) {
      return {
        suggestions: [leaf(findPath("R"), "Folder meta / system file → R - Raw")],
        unclear: false,
      };
    }

    if (/\b(wedding|graduation|forever|milestone|special event)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("S"), "Major life / permanent event → S")],
        unclear: false,
      };
    }
    if (/\b(one-?off|one off|single event|party invite)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("X"), "One-off event → X")],
        unclear: false,
      };
    }
    if (/\b(temporary|tmp|days only|short-?lived)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("T"), "Days-scale temporary → T")],
        unclear: false,
      };
    }

    if (/\b(travel|itinerary|flight|hotel|boarding)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("A5"), "All travel → A5 Travel")],
        unclear: false,
      };
    }

    if (/\b(household|shared finance|joint account|rent agreement)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("H2"), "Shared/household finance → H2")],
        unclear: false,
      };
    }
    if (
      /\b(invoice|e-?bill|bank statement|receipt|tax)\b/.test(text) ||
      (ext === ".pdf" && /\b(bill|statement)\b/.test(text))
    ) {
      if (/\b(bank statement)\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("F2"), "Bank statement → F2")],
          unclear: false,
        };
      }
      if (/\b(e-?bill|bill)\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("F1"), "E-bill → F1")],
          unclear: false,
        };
      }
      if (/\b(email confirmation)\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("F3"), "Email confirmation → F3")],
          unclear: false,
        };
      }
      return {
        suggestions: [
          leaf(findPath("F"), "Personal finance → F"),
          leaf(findPath("F1"), "Likely e-bill", "candidate"),
        ],
        unclear: false,
      };
    }

    if (/\b(active project|work project|project budget|sprint)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("A2"), "Active work project → A2 Work")],
        unclear: false,
      };
    }
    if (
      /\b(company doc|company profile|employer|hr letter)\b/.test(text) &&
      !/\b(active project|work project)\b/.test(text)
    ) {
      return {
        suggestions: [leaf(findPath("G4"), "Company docs without active project → G4")],
        unclear: false,
      };
    }

    if (/\b(cpr|exam|certification test)\b/.test(text)) {
      if (/\bcpr\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("A41"), "CPR exam materials → A41")],
          unclear: false,
        };
      }
      return {
        suggestions: [leaf(findPath("A4"), "Exam materials → A4")],
        unclear: false,
      };
    }
    if (/\b(soft skill|personal development|toastmasters|communication course)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("A1"), "Soft-skill study → A1 Personal")],
        unclear: false,
      };
    }
    if (/\b(study|tutorial|course notes|technical learning|lecture)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("A3"), "Technical study → A3 Study Material")],
        unclear: false,
      };
    }

    if (/\b(minecraft|ets2|euro truck|cities skylines|satisfactory|game save|game mod)\b/.test(text)) {
      if (/\bminecraft\b/.test(text) && /\bmod\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("E12"), "Minecraft mod → E12")],
          unclear: false,
        };
      }
      if (/\bminecraft\b/.test(text) && /\bskin\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("E13"), "Minecraft skin → E13")],
          unclear: false,
        };
      }
      if (/\bminecraft\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("E1"), "Minecraft → E1")],
          unclear: false,
        };
      }
      return {
        suggestions: [leaf(findPath("E"), "Games → E")],
        unclear: false,
      };
    }
    if (
      /\b(installer|setup\.exe|application|software)\b/.test(text) ||
      [".exe", ".msi", ".dmg", ".pkg"].indexOf(ext) >= 0
    ) {
      return {
        suggestions: [leaf(findPath("D"), "Non-game software → D Program")],
        unclear: false,
      };
    }

    if (
      /\b(photo|image|wallpaper|jpg|png|heic)\b/.test(text) ||
      [".jpg", ".jpeg", ".png", ".heic", ".webp", ".gif"].indexOf(ext) >= 0
    ) {
      if (/\bwallpaper\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("B4"), "Wallpaper → B4")],
          unclear: false,
        };
      }
      return {
        suggestions: [
          leaf(findPath("B1"), "Photos/images → B (never G)"),
          leaf(findPath("B"), "Image home", "candidate"),
        ],
        unclear: false,
      };
    }
    if (/\b(contact|passport|person info|pet vet|family record)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("G"), "Person/pet info → G Peoples")],
        unclear: false,
      };
    }

    if (/\b(anime|animation watched|episode)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("C21"), "Animation you watch → C21 Animate")],
        unclear: false,
      };
    }
    if (/\b(my animation|blender project|creative work|illustration i made|art i made)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("K"), "Creative work you make → K")],
        unclear: false,
      };
    }

    if (
      /\b(song|mp3|ringtone|music)\b/.test(text) ||
      [".mp3", ".flac", ".wav", ".m4a"].indexOf(ext) >= 0
    ) {
      if (/\bringtone\b/.test(text)) {
        return {
          suggestions: [leaf(findPath("C12"), "Ringtone → C12")],
          unclear: false,
        };
      }
      return {
        suggestions: [leaf(findPath("C11"), "Songs → C11")],
        unclear: false,
      };
    }

    if (
      /\b(movie|film)\b/.test(text) ||
      ([".mkv", ".mp4", ".avi"].indexOf(ext) >= 0 && /\b(movie|film)\b/.test(text))
    ) {
      return {
        suggestions: [leaf(findPath("C22"), "Movie → C22")],
        unclear: false,
      };
    }

    if (/\b(manual|instruction)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("H1"), "Instruction manuals → H1")],
        unclear: false,
      };
    }

    if (/\b(backup|device dump)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("V"), "Device backup → V")],
        unclear: false,
      };
    }

    if (/\b(unsorted|inbox|misc)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("U"), "Holding pen → U")],
        unclear: false,
      };
    }

    if (/\b(shortcut|symlink|alias)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("Z"), "Shortcuts only → Z")],
        unclear: false,
      };
    }

    if (/\b(idea|brainstorm)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("I"), "Ideas → I")],
        unclear: false,
      };
    }

    if (/\b(ebook|pdf book|library)\b/.test(text)) {
      return {
        suggestions: [leaf(findPath("L"), "Library → L")],
        unclear: false,
      };
    }

    const candidates = [];
    if (/\bwork\b/.test(text)) {
      candidates.push(leaf(findPath("A2"), "Mentions work", "candidate"));
    }
    if (/\bpersonal\b/.test(text)) {
      candidates.push(leaf(findPath("A1"), "Mentions personal", "candidate"));
    }
    return { suggestions: candidates, unclear: true };
  }

  global.FilingMap = global.FilingMap || {};
  global.FilingMap.suggestFromRules = suggestFromRules;
})(typeof window !== "undefined" ? window : globalThis);
