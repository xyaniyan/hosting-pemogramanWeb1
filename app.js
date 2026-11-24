function forexDesk() {
    const initialPairs = [
        {
            pair: "EUR/USD",
            label: "Euro / US Dollar",
            group: "MAJOR",
            decimals: 5,
            pipSize: 0.0001,
            spreadPips: 1.2,
            openMid: 1.08420,
            mid: 1.08465,
            history: [1.08420, 1.08432, 1.08415, 1.08448, 1.08460, 1.08452, 1.08475, 1.08465]
        },
        {
            pair: "GBP/USD",
            label: "British Pound / US Dollar",
            group: "MAJOR",
            decimals: 5,
            pipSize: 0.0001,
            spreadPips: 1.5,
            openMid: 1.27150,
            mid: 1.27110,
            history: [1.27150, 1.27138, 1.27162, 1.27125, 1.27105, 1.27120, 1.27098, 1.27110]
        },
        {
            pair: "USD/JPY",
            label: "US Dollar / Japanese Yen",
            group: "MAJOR",
            decimals: 3,
            pipSize: 0.01,
            spreadPips: 1.1,
            openMid: 154.280,
            mid: 154.440,
            history: [154.280, 154.320, 154.290, 154.360, 154.410, 154.390, 154.470, 154.440]
        },
        {
            pair: "USD/CHF",
            label: "US Dollar / Swiss Franc",
            group: "MAJOR",
            decimals: 5,
            pipSize: 0.0001,
            spreadPips: 1.4,
            openMid: 0.88210,
            mid: 0.88185,
            history: [0.88210, 0.88202, 0.88218, 0.88195, 0.88180, 0.88190, 0.88175, 0.88185]
        },
        {
            pair: "EUR/JPY",
            label: "Euro / Japanese Yen",
            group: "CROSS",
            decimals: 3,
            pipSize: 0.01,
            spreadPips: 1.8,
            openMid: 167.310,
            mid: 167.520,
            history: [167.310, 167.350, 167.330, 167.420, 167.480, 167.460, 167.550, 167.520]
        },
        {
            pair: "AUD/JPY",
            label: "Australian Dollar / Japanese Yen",
            group: "CROSS",
            decimals: 3,
            pipSize: 0.01,
            spreadPips: 2.0,
            openMid: 101.640,
            mid: 101.510,
            history: [101.640, 101.610, 101.650, 101.580, 101.540, 101.560, 101.490, 101.510]
        }
    ];

    function buildPairs(item) {
        const halfSpread = (item.spreadPips * item.pipSize) / 2;
        const bid = Number((item.mid - halfSpread).toFixed(item.decimals));
        const ask = Number((item.mid + halfSpread).toFixed(item.decimals));
        const changePips = (item.mid - item.openMid) / item.pipSize;
        return { ...item, bid, ask, changePips, history: [...item.history] };
    }

    function cloneInitialPairs() {
        return initialPairs.map(buildPairs);
    }

    return {
        fxTheme: "slate",
        pairs: cloneInitialPairs(),
        pairGroup: "ALL",
        activePair: "EUR/USD",
        streaming: true,
        balance: 10000,
        lotSize: 0.10,
        positions: [],
        tradeNote: "",
        wibTime: "WIB 00:00:00",
        activeSession: "LONDON / NY OVERLAP",

        init() {
            this.updateClock();
            setInterval(() => this.updateClock(), 1000);
            setInterval(() => {
                if (this.streaming) this.tickQuotes();
            }, 1400);
        },

        get filteredPairs() {
            if (this.pairGroup === "ALL") return this.pairs;
            return this.pairs.filter(p => p.group === this.pairGroup);
        },

        get currentPair() {
            return this.pairs.find(p => p.pair === this.activePair) || this.pairs[0];
        },

        get estimatedPipValue() {
            const lots = Math.max(0.01, Number(this.lotSize) || 0.01);
            // Approx USD per pip for 1.00 standard lot (~$10 for USD-quote, ~$6.5 for JPY-quote)
            const basePerStandardLot = this.currentPair.pair.endsWith("/JPY") ? 6.5 : 10;
            return lots * basePerStandardLot;
        },

        get requiredMargin() {
            const lots = Math.max(0.01, Number(this.lotSize) || 0.01);
            // 1:100 leverage simulation -> $1,000 per 1.00 standard lot
            return lots * 1000;
        },

        get totalFloatingPnl() {
            return this.positions.reduce((sum, pos) => sum + this.calcPositionPnl(pos), 0);
        },

        get linePoints() {
            const pts = this.currentPair.history;
            const min = Math.min(...pts);
            const max = Math.max(...pts);
            const span = max - min || this.currentPair.pipSize;
            const w = 500;
            const h = 120;

            return pts.map((val, idx) => {
                const x = (idx / (pts.length - 1)) * w;
                const y = h - ((val - min) / span) * (h - 20) + 10;
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            }).join(" ");
        },

        get areaPoints() {
            return `0,140 ${this.linePoints} 500,140`;
        },

        selectPair(pairCode) {
            this.activePair = pairCode;
            this.tradeNote = "";
        },

        formatRate(item, val) {
            return Number(val).toFixed(item.decimals);
        },

        formatUsd(val) {
            const sign = val < 0 ? "-" : "";
            return `${sign}$${Math.abs(val).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        },

        tickQuotes() {
            this.pairs.forEach(item => {
                const deltaPips = Math.floor(Math.random() * 5) - 2; // -2 to +2 pips
                const nextMid = Number((item.mid + deltaPips * item.pipSize).toFixed(item.decimals));
                const halfSpread = (item.spreadPips * item.pipSize) / 2;

                item.mid = Math.max(item.pipSize * 10, nextMid);
                item.bid = Number((item.mid - halfSpread).toFixed(item.decimals));
                item.ask = Number((item.mid + halfSpread).toFixed(item.decimals));
                item.changePips = (item.mid - item.openMid) / item.pipSize;

                item.history.push(item.mid);
                if (item.history.length > 25) item.history.shift();
            });
        },

        openPosition(side) {
            const lots = Math.max(0.01, Number(this.lotSize) || 0.01);
            const margin = lots * 1000;
            if (margin > this.balance) {
                this.tradeNote = "Margin tidak cukup untuk ukuran lot tersebut.";
                return;
            }

            const p = this.currentPair;
            const entryPrice = side === "BUY" ? p.ask : p.bid;
            const pipValue = p.pair.endsWith("/JPY") ? lots * 6.5 : lots * 10;

            this.balance -= margin;
            this.positions.unshift({
                id: Date.now() + Math.random(),
                pair: p.pair,
                side,
                lot: lots,
                entryPrice,
                margin,
                pipSize: p.pipSize,
                pipValue
            });

            this.tradeNote = `Posisi ${side} ${lots.toFixed(2)} lot ${p.pair} dibuka @ ${entryPrice}.`;
        },

        calcPositionPnl(pos) {
            const p = this.pairs.find(x => x.pair === pos.pair);
            if (!p) return 0;
            const exitPrice = pos.side === "BUY" ? p.bid : p.ask;
            const rawDiff = pos.side === "BUY" ? (exitPrice - pos.entryPrice) : (pos.entryPrice - exitPrice);
            const pips = rawDiff / pos.pipSize;
            return pips * pos.pipValue;
        },

        closePosition(id) {
            const idx = this.positions.findIndex(x => x.id === id);
            if (idx === -1) return;
            const pos = this.positions[idx];
            const pnl = this.calcPositionPnl(pos);
            this.balance += pos.margin + pnl;
            this.positions.splice(idx, 1);
            this.tradeNote = `Posisi ${pos.pair} ditutup (${pnl >= 0 ? "+" : ""}${this.formatUsd(pnl)}).`;
        },

        resetDesk() {
            this.pairs = cloneInitialPairs();
            this.balance = 10000;
            this.lotSize = 0.10;
            this.positions = [];
            this.tradeNote = "Akun simulasi direset ke $10,000.00.";
        },

        toggleTheme() {
            this.fxTheme = this.fxTheme === "slate" ? "light" : "slate";
        },

        updateClock() {
            const now = new Date();
            const wib = new Intl.DateTimeFormat("id-ID", {
                timeZone: "Asia/Jakarta",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false
            }).format(now).replaceAll(".", ":");
            this.wibTime = `WIB ${wib}`;

            const hour = Number(wib.slice(0, 2));
            if (hour >= 7 && hour < 15) this.activeSession = "TOKYO / ASIA";
            else if (hour >= 15 && hour < 19) this.activeSession = "LONDON OPEN";
            else if (hour >= 19 || hour < 4) this.activeSession = "LONDON / NY OVERLAP";
            else this.activeSession = "SYDNEY / QUIET";
        }
    };
}