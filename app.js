(() => {
  'use strict';

  const MONTHS = [
    'Jänner',
    'Februar',
    'März',
    'April',
    'Mai',
    'Juni',
    'Juli',
    'August',
    'September',
    'Oktober',
    'November',
    'Dezember'
  ];

  const CATEGORIES = [
    'Montage',
    'Lieferung',
    'Produktion',
    'Inbetriebnahme',
    'Abnahme',
    'Service',
    'Urlaub',
    'Krank',
    'Feiertag',
    'Besprechung',
    'Wartung',
    'Sonstiges'
  ];

  const cfg = window.APP_CONFIG || {};
  const key = cfg.SUPABASE_PUBLISHABLE_KEY || '';

  const live = Boolean(
    cfg.SUPABASE_URL &&
    key &&
    window.supabase
  );

  const client = live
    ? window.supabase.createClient(cfg.SUPABASE_URL, key)
    : null;

  const state = {
    year: new Date().getFullYear(),
    entries: [],
    channel: null,
    searchHits: [],
    searchIndex: 0,

    // Beim ersten vollständigen Rendern zum heutigen Tag springen.
    scrollToTodayOnNextRender: true,
    smoothTodayScroll: false
  };

  const $ = id => document.getElementById(id);

  const iso = date =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  const parse = value => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const norm = value =>
    String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const cls = value => `cat-${norm(value)}`;

  function week(date) {
    const current = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      )
    );

    const day = current.getUTCDay() || 7;

    current.setUTCDate(
      current.getUTCDate() + 4 - day
    );

    const yearStart = new Date(
      Date.UTC(current.getUTCFullYear(), 0, 1)
    );

    return Math.ceil(
      (((current - yearStart) / 86400000) + 1) / 7
    );
  }

  function overlap(entry, date) {
    const currentDate = iso(date);

    return (
      entry.start_date <= currentDate &&
      entry.end_date >= currentDate
    );
  }

  function filtered() {
    const query = norm($('searchInput').value);
    const category = $('categoryFilter').value;

    return state.entries.filter(entry => {
      const searchableText = norm([
        entry.title,
        entry.project_number,
        entry.notes,
        entry.category
      ].join(' '));

      const matchesQuery =
        !query ||
        searchableText.includes(query);

      const matchesCategory =
        !category ||
        entry.category === category;

      return matchesQuery && matchesCategory;
    });
  }

  function setup() {
    CATEGORIES.forEach(category => {
      $('categoryFilter').add(
        new Option(category, category)
      );

      $('entryCategory').add(
        new Option(category, category)
      );

      const legendItem = document.createElement('span');

      legendItem.innerHTML =
        `<i class="dot ${cls(category)}"></i>${category}`;

      $('legend').appendChild(legendItem);
    });

    const currentYear = new Date().getFullYear();

    for (
      let year = currentYear - 5;
      year <= currentYear + 8;
      year++
    ) {
      $('yearSelect').add(
        new Option(year, year)
      );
    }

    $('yearSelect').value = state.year;

    if (matchMedia('(max-width:760px)').matches) {
      const legendDetails =
        document.querySelector('.legend-details');

      if (legendDetails) {
        legendDetails.open = false;
      }
    }
  }

  function monthNav() {
    const navigation = $('monthNav');

    navigation.innerHTML = '';
    $('sidebarYear').textContent = state.year;

    MONTHS.forEach((month, index) => {
      const button = document.createElement('button');

      button.textContent = month;
      button.dataset.month = index;

      button.onclick = () => {
        document
          .getElementById(`month-${index}`)
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
      };

      navigation.appendChild(button);
    });
  }

  function jumpToEntry(entry) {
    const startDate = parse(entry.start_date);

    if (startDate.getFullYear() !== state.year) {
      state.year = startDate.getFullYear();
      $('yearSelect').value = state.year;
      render();
    }

    requestAnimationFrame(() => {
      const target =
        document.querySelector(
          `[data-date="${entry.start_date}"]`
        ) ||
        document.getElementById(
          `month-${startDate.getMonth()}`
        );

      target?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });

      document
        .querySelectorAll('.search-hit')
        .forEach(element => {
          element.classList.remove('search-hit');
        });

      if (target?.classList.contains('day')) {
        target.classList.add('search-hit');

        setTimeout(() => {
          target.classList.remove('search-hit');
        }, 2200);
      }
    });
  }

  function updateSearchNavigator(reset = false) {
    const query = $('searchInput').value.trim();
    const category = $('categoryFilter').value;
    const box = $('searchNavigator');

    state.searchHits = filtered().sort(
      (a, b) =>
        a.start_date.localeCompare(b.start_date)
    );

    if (reset) {
      state.searchIndex = 0;
    }

    if (state.searchIndex >= state.searchHits.length) {
      state.searchIndex = 0;
    }

    if (!query && !category) {
      box.classList.add('hidden');
      box.innerHTML = '';
      return;
    }

    box.classList.remove('hidden');

    if (!state.searchHits.length) {
      box.innerHTML =
        '<span>Keine passenden Termine gefunden.</span>';
      return;
    }

    const current =
      state.searchHits[state.searchIndex];

    box.innerHTML = `
      <span>
        <strong>
          ${state.searchIndex + 1} /
          ${state.searchHits.length}
        </strong>
        Treffer
      </span>

      <div>
        <button
          type="button"
          id="prevHit"
          class="mini-btn"
          aria-label="Vorheriger Treffer"
        >
          ‹
        </button>

        <button
          type="button"
          id="showHit"
          class="mini-btn text-btn"
        >
          Zum Treffer
        </button>

        <button
          type="button"
          id="nextHit"
          class="mini-btn"
          aria-label="Nächster Treffer"
        >
          ›
        </button>
      </div>
    `;

    $('prevHit').onclick = () => {
      state.searchIndex =
        (
          state.searchIndex -
          1 +
          state.searchHits.length
        ) % state.searchHits.length;

      updateSearchNavigator();

      jumpToEntry(
        state.searchHits[state.searchIndex]
      );
    };

    $('nextHit').onclick = () => {
      state.searchIndex =
        (
          state.searchIndex + 1
        ) % state.searchHits.length;

      updateSearchNavigator();

      jumpToEntry(
        state.searchHits[state.searchIndex]
      );
    };

    $('showHit').onclick = () => {
      jumpToEntry(current);
    };
  }

  function scrollToTodayAfterRender() {
    if (!state.scrollToTodayOnNextRender) {
      return;
    }

    const today = new Date();

    // Nur scrollen, wenn das aktuell dargestellte Jahr
    // auch das laufende Jahr ist.
    if (state.year !== today.getFullYear()) {
      state.scrollToTodayOnNextRender = false;
      return;
    }

    const todayString = iso(today);
    const smooth = state.smoothTodayScroll;

    // Flag sofort zurücksetzen, damit spätere Render-Vorgänge
    // nicht wieder automatisch zum heutigen Tag springen.
    state.scrollToTodayOnNextRender = false;
    state.smoothTodayScroll = false;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = document.querySelector(
          `[data-date="${todayString}"]`
        );

        target?.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'center',
          inline: 'nearest'
        });
      });
    });
  }

  function render() {
    monthNav();

    const entries = filtered();

    updateSearchNavigator();

    $('calendar').innerHTML = '';

    const template = $('monthTemplate');
    const today = iso(new Date());

    MONTHS.forEach((monthName, monthIndex) => {
      const card =
        template.content.firstElementChild.cloneNode(true);

      card.id = `month-${monthIndex}`;

      card.querySelector('h2').textContent =
        monthName;

      const monthStart = iso(
        new Date(
          state.year,
          monthIndex,
          1
        )
      );

      const monthEnd = iso(
        new Date(
          state.year,
          monthIndex + 1,
          0
        )
      );

      const monthEntries = entries.filter(
        entry =>
          entry.start_date <= monthEnd &&
          entry.end_date >= monthStart
      );

      card.querySelector('.month-count').textContent =
        `${monthEntries.length} Termin${
          monthEntries.length === 1 ? '' : 'e'
        }`;

      const days = card.querySelector('.days');

      const firstDay = new Date(
        state.year,
        monthIndex,
        1
      );

      const offset =
        (firstDay.getDay() + 6) % 7;

      const calendarStart = new Date(
        state.year,
        monthIndex,
        1 - offset
      );

      for (let row = 0; row < 6; row++) {
        const monday = new Date(calendarStart);

        monday.setDate(
          calendarStart.getDate() +
          row * 7
        );

        const weekNumber =
          document.createElement('div');

        weekNumber.className = 'week-number';
        weekNumber.textContent = week(monday);

        days.appendChild(weekNumber);

        for (
          let column = 0;
          column < 7;
          column++
        ) {
          const date = new Date(calendarStart);

          date.setDate(
            calendarStart.getDate() +
            row * 7 +
            column
          );

          const dateString = iso(date);

          const cell =
            document.createElement('div');

          cell.className = 'day';
          cell.dataset.date = dateString;

          if (date.getMonth() !== monthIndex) {
            cell.classList.add('outside');
          }

          if (dateString === today) {
            cell.classList.add('today');
          }

          cell.innerHTML = `
            <span class="day-number">
              ${date.getDate()}
            </span>

            <div class="events"></div>
          `;

          const dayEntries = entries.filter(
            entry => overlap(entry, date)
          );

          dayEntries
            .slice(0, 4)
            .forEach(entry => {
              const button =
                document.createElement('button');

              button.className =
                `event ${cls(entry.category)}`;

              button.innerHTML = `
                ${
                  entry.project_number
                    ? `<strong>${entry.project_number}</strong>`
                    : ''
                }

                <span>${entry.title}</span>
              `;

              button.title =
                `${entry.category}: ${entry.title}` +
                (
                  entry.project_number
                    ? `\nProjekt: ${entry.project_number}`
                    : ''
                ) +
                (
                  entry.notes
                    ? `\n${entry.notes}`
                    : ''
                );

              button.onclick = event => {
                event.stopPropagation();
                openEntry(entry);
              };

              cell
                .querySelector('.events')
                .appendChild(button);
            });

          if (dayEntries.length > 4) {
            const more =
              document.createElement('div');

            more.className = 'more';
            more.textContent =
              `+${dayEntries.length - 4} weitere`;

            cell
              .querySelector('.events')
              .appendChild(more);
          }

          cell.ondblclick = () => {
            openEntry(null, dateString);
          };

          days.appendChild(cell);
        }
      }

      $('calendar').appendChild(card);
    });

    // Erst nachdem alle zwölf Monate vollständig aufgebaut wurden,
    // wird beim ersten Laden beziehungsweise nach Klick auf „Heute“
    // zum aktuellen Tag gescrollt.
    scrollToTodayAfterRender();
  }

  async function load() {
    if (!live) {
      state.entries = JSON.parse(
        localStorage.getItem(
          'mad_company_calendar'
        ) || '[]'
      );

      $('modeBadge').textContent = 'Lokal';

      render();
      return;
    }

    const { data, error } = await client
      .from('company_calendar_entries')
      .select('*')
      .order('start_date');

    if (error) {
      $('modeBadge').textContent = 'Fehler';

      console.error(error);

      alert(
        'Supabase-Tabelle fehlt oder ist nicht freigegeben. Bitte SQL-Update prüfen.'
      );

      // Kalender auch bei einem Ladefehler anzeigen.
      render();
      return;
    }

    state.entries = data || [];
    $('modeBadge').textContent = 'Online';

    render();
  }

  function openEntry(entry = null, date = null) {
    $('entryForm').reset();

    $('entryId').value =
      entry?.id || '';

    $('entryDialogTitle').textContent =
      entry
        ? 'Termin bearbeiten'
        : 'Termin eintragen';

    $('entryCategory').value =
      entry?.category || 'Montage';

    $('entryTitle').value =
      entry?.title || '';

    const startDate =
      entry?.start_date ||
      date ||
      iso(new Date());

    const endDate =
      entry?.end_date ||
      date ||
      startDate;

    $('entryStart').value = startDate;
    $('entryEnd').value = endDate;

    // Das Bis-Datum darf nicht vor dem Von-Datum liegen.
    $('entryEnd').min = startDate;

    $('entryProjectNumber').value =
      entry?.project_number || '';

    $('entryNotes').value =
      entry?.notes || '';

    $('deleteEntryBtn').classList.toggle(
      'hidden',
      !entry
    );

    $('entryDialog').showModal();
  }

  async function save(event) {
    event.preventDefault();

    const id = $('entryId').value;

    const payload = {
      category:
        $('entryCategory').value,

      title:
        $('entryTitle').value.trim(),

      start_date:
        $('entryStart').value,

      end_date:
        $('entryEnd').value,

      project_number:
        $('entryProjectNumber').value.trim(),

      notes:
        $('entryNotes').value.trim()
    };

    if (payload.end_date < payload.start_date) {
      alert(
        'Das Enddatum darf nicht vor dem Startdatum liegen.'
      );

      return;
    }

    if (!live) {
      if (id) {
        state.entries =
          state.entries.map(entry =>
            String(entry.id) === String(id)
              ? {
                  ...entry,
                  ...payload
                }
              : entry
          );
      } else {
        state.entries.push({
          id: crypto.randomUUID(),
          ...payload
        });
      }

      localStorage.setItem(
        'mad_company_calendar',
        JSON.stringify(state.entries)
      );

      $('entryDialog').close();

      render();
      return;
    }

    const { error } = id
      ? await client
          .from('company_calendar_entries')
          .update(payload)
          .eq('id', id)
      : await client
          .from('company_calendar_entries')
          .insert(payload);

    if (error) {
      alert(error.message);
      return;
    }

    $('entryDialog').close();

    await load();
  }

  async function del() {
    const id = $('entryId').value;

    if (
      !id ||
      !confirm('Termin wirklich löschen?')
    ) {
      return;
    }

    if (!live) {
      state.entries =
        state.entries.filter(
          entry =>
            String(entry.id) !== String(id)
        );

      localStorage.setItem(
        'mad_company_calendar',
        JSON.stringify(state.entries)
      );

      $('entryDialog').close();

      render();
      return;
    }

    const { error } = await client
      .from('company_calendar_entries')
      .delete()
      .eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    $('entryDialog').close();

    await load();
  }

  function jumpToday(smooth = true) {
    const today = new Date();

    state.year = today.getFullYear();
    $('yearSelect').value = state.year;

    state.scrollToTodayOnNextRender = true;
    state.smoothTodayScroll = smooth;

    render();
  }

  function bind() {
    $('prevYearBtn').onclick = () => {
      state.year--;
      $('yearSelect').value = state.year;

      // Bei manueller Jahresnavigation nicht automatisch
      // zum heutigen Tag zurückspringen.
      state.scrollToTodayOnNextRender = false;

      render();
    };

    $('nextYearBtn').onclick = () => {
      state.year++;
      $('yearSelect').value = state.year;

      state.scrollToTodayOnNextRender = false;

      render();
    };

    $('yearSelect').onchange = () => {
      state.year =
        +$('yearSelect').value;

      state.scrollToTodayOnNextRender = false;

      render();
    };

    // Der Heute-Button scrollt weich zum aktuellen Tag.
    $('todayBtn').onclick = () => {
      jumpToday(true);
    };

    $('newEntryBtn').onclick = () => {
      openEntry();
    };

    $('searchInput').oninput = () => {
      state.searchIndex = 0;

      // Suche darf nicht durch den automatischen Heute-Sprung
      // überschrieben werden.
      state.scrollToTodayOnNextRender = false;

      render();

      if (state.searchHits.length) {
        jumpToEntry(
          state.searchHits[0]
        );
      }
    };

    $('searchInput').onkeydown = event => {
      if (
        event.key === 'Enter' &&
        state.searchHits.length
      ) {
        event.preventDefault();

        jumpToEntry(
          state.searchHits[
            state.searchIndex
          ]
        );
      }
    };

    $('categoryFilter').onchange = () => {
      state.searchIndex = 0;
      state.scrollToTodayOnNextRender = false;

      render();
    };

    $('clearFiltersBtn').onclick = () => {
      $('searchInput').value = '';
      $('categoryFilter').value = '';

      state.searchIndex = 0;
      state.scrollToTodayOnNextRender = false;

      render();
    };

    // Beim Ändern des Von-Datums wird das Bis-Datum
    // mindestens auf dasselbe Datum gesetzt.
    $('entryStart').addEventListener(
      'change',
      () => {
        const startDate =
          $('entryStart').value;

        const endDate =
          $('entryEnd');

        if (!startDate) {
          endDate.removeAttribute('min');
          return;
        }

        endDate.min = startDate;

        if (
          !endDate.value ||
          endDate.value < startDate
        ) {
          endDate.value = startDate;
        }
      }
    );

    $('entryForm').onsubmit = save;

    $('deleteEntryBtn').onclick = del;

    $('closeEntryDialog').onclick =
      $('cancelEntryBtn').onclick =
        () => {
          $('entryDialog').close();
        };
  }

  async function init() {
    setup();
    bind();

    // load() lädt die Daten und führt danach render() aus.
    // Der automatische Heute-Sprung erfolgt dabei direkt
    // am Ende von render().
    await load();

    if (live) {
      state.channel = client
        .channel('company-calendar-live')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'company_calendar_entries'
          },
          load
        )
        .subscribe();
    }
  }

  init();
})();
