class Logs {
    
    static shift_array_week(list) {
        const begin = list.slice(Config.day);
        const end = list.slice(0, Config.day);
        return begin.concat(end);
    }
    
    static is_similar(data1, data2) {
        var d1 = new Date(data1["timestamp"] * 1000);
        var d2 = new Date(data2["timestamp"] * 1000);
        // True if the two entries has been registered within a 1 hour window.
        return Math.abs(d1 - d2) < 1000 * 60 * 60;
    }

    static build_color_ramp(name, r, g, b, steps) {
        var style = "";
        
        for (var i = 0; i <= steps; ++i) {
            const ri = Math.ceil(255 * r * i / steps);
            const gi = Math.ceil(255 * g * i / steps);
            const bi = Math.ceil(255 * b * i / steps);
            
            style += ".range-" + name + "-" + i + "-" + steps + "{ background: #" + Logs.toHex(ri) + Logs.toHex(gi) + Logs.toHex(bi) + " !important;";
            if ((ri * 0.3 + gi * 1.05 + bi * .2) / 3 > 65)
                style += " color: 000 !important;";
            style += "}";
        }

        var styleSheet = document.createElement("style");
        styleSheet.type = "text/css";
        styleSheet.innerText = style;
        document.head.appendChild(styleSheet);

    }
    
    static get_class_range(rangename, value, min, max, nb_steps) {
        if (value < min) 
            value = 0;
        else if (min == max)
            value = 0;
        else {
            value = Math.ceil(((value - min)/ (max - min))**(1/3) * nb_steps);
            if (value < 0) value = 0;
        }
        return "range-" + rangename + "-" + value + "-" + nb_steps;
    }

    static get_class_range2(rangename, value, min, max, nb_steps) {
        if (value < min) 
            value = 0;
        else if (min == max)
            value = 0;
        else {
            value = Math.ceil(((value - min)/ (max - min))**(3/5) * nb_steps);
            if (value < 0) value = 0;
        }
        return "range-" + rangename + "-" + value + "-" + nb_steps;
    }


    
    static nbToEpisode(i) {
        if (i < 10)
            return "S01E0" + i;
        else
            return "S01E" + i;
            
    }
    
    static toHex(d) {
        return  ("0"+(Number(d).toString(16))).slice(-2).toUpperCase()
    }


    static similar_in_list(data_set, data) {
        for(var did in data_set) {
            if (Logs.is_similar(data_set[did], data)) {
                return true;
            }
        }
        return false;
    }
    
    
    static filter_data(data) {
        
        
        // merge similar entries
        var f_set = {};
        for (var row in data) {
            if (!Config.ip_to_remove.includes(data[row]["ip"])) { // remove unwanted addresses
                var key = data[row]["ip"] + " " + data[row]["user-agent"] + " " + data[row]["episode"];
                if (! (key in f_set))
                    f_set[key] = [];
                if (!Logs.similar_in_list(f_set[key], data[row]))
                    f_set[key].push(data[row]);
            }
        }

        var result = [];
        
        for(var f in f_set) {
            for (var fid in f_set[f]) {
                result.push(f_set[f][fid]);
            }
        }
        
        return result;
    }   

    static in_future(j, h) {
        var today = new Date();
        var week_day = (today.getDay() - Config.day);
        if (week_day < 0) week_day += 7;
        var hour = today.getHours();

        if (j < week_day)
            return false;
        else if (j == week_day) {
            return h > hour;
        }
        else 
            return true;
    }
    
    static create_details_week(current = false) {
        var result = [];
        for (var j = 0; j < 7; ++j) {
            result.push([]);
            for(var h = 0; h < 24; ++h) {
                if (current && Logs.in_future(j, h))
                    result[j].push(-1);
                else
                    result[j].push(0);
            }
        }
    
        return result;
    }
    
    
    static get_max_details_semaine(table) {
        var max = 0;
        var sum = 0;
        for(let j = 0; j < 7; ++j) {
            for(let h = 0; h != 24; h++) {
                if (table[j][h] > max)
                    max = table[j][h];
                if (table[j][h] > 0)
                    sum += table[j][h];
            }
        }
        return [max, sum];
    }
    
    static details_semaines(table, title, description) {
        var [max, sum] = Logs.get_max_details_semaine(table);
        if (!Number.isInteger(sum))
            sum = sum.toFixed(1);
    
        var result = '<div class="col-sm">';
        
        result += '<div class="card">';
        result += '<div class="card-body">';
        result += '<h3 class="card-title">' + title + ' (' + sum + ')</h3>';

        result += '<table class="table layout_fixed table-bordered table-dark">';
        result += '<caption>' + description + '</caption>';
        result += "<thead>";
        result += "<tr>";
        result += '<th scope="col"> </th>';
        for(let h = 0; h != 24; h++) {
            result += '<th scope="col">' + (h) + "</th>";
        }
        result += '<th scope="col">total</th>';
        result += "</tr>";
        result += "</thead>";
        result += "<tbody>";
        
        var day_small_name = Logs.shift_array_week([ "dim", "lun", "ma", "mer", "je", "ven", "sam",  ]);
        for(let j = 0; j < 7; ++j) {
            result += "<tr>";
            result += '<th scope="row">' + day_small_name[j] + "</th>";
            var s = 0;
            for(let h = 0; h != 24; h++) {
                if (table[j][h] >= 0) {
                    result += '<td';
                    result += ' class="' + Logs.get_class_range2("p", table[j][h], 0, max, 8)+ '"';
                    result += '>';
                    if (Number.isInteger(table[j][h]))
                        result += table[j][h];
                    else {
                        result += table[j][h].toFixed(1);
                    }
                    result += '</td>';
                    s += table[j][h];
                }
                else
                    result += '<td></td>';
            }
            if (Number.isInteger(s))
                result += "<td>" + s + "</td>";
            else
                result += "<td>" + s.toFixed(1) + "</td>";
            
            result += "</tr>";
        }
        
        
        result += "</tbody>";
        result += "</table>";
        
        result += '</div>';
        result += '</div>';
        
        result += '</div>';
        return result;
    }
    
    
    static add_agent(table, week_id, entry) {
        if (entry === undefined || entry === null)
            entry = "unknown";
        if (! (week_id in table)) {
            table[week_id] = {};
        }
        if (! (entry in table[week_id])) {
            table[week_id][entry] = 1;
        }
        else
            table[week_id][entry] += 1;
        
        if (! ("total" in table[week_id])) {
            table[week_id]["total"] = 1;
        }
        else
            table[week_id]["total"] += 1;
        
        if (!("total" in table)) {
            table["total"] = {};
        }
        if (! (entry in table["total"])) {
            table["total"][entry] = 1;
        }
        else
            table["total"][entry] += 1;
    }
    
    static compare(e1, e2) {
        if (e1["name"] == "unknown")
            return 1;
        else if (e2["name"]  == "unknown")
            return -1;
        else
            return e2["nb"] - e1["nb"];
        
    }
    
    build_description_agents(table, description) {
        var nb_total = this.data.length;
        var result = "";
        var order = [];
        for(let entry in table["total"]) {
            order.push({ "name": entry, "nb": table["total"][entry]});
        }
        order.sort(Logs.compare);
        
        result += '<div class="card">';
        result += '<div class="card-body">';
        result += '<h3 class="card-title">' + description + '</h3>';
        
        // head
        result += '<table class="table table-bordered table-dark">';
        result += '<caption>Évolution de la répartition des sources (' + description + ') par semaine</caption>';
        result += "<thead>";
        result += "<tr>";
        result += '<th scope="col"> </th>';
        for(let s = 0; s != this.nb_weeks_total; s++) {
            result += '<th scope="col">' + (s + 1) + "</th>";
        }
        result += '<th scope="col">total</th>';
        result += "</tr>";
        result += "</thead>";
        result += "<tbody>";
        
        var total_per_week = [];
        for(let oid in order) {
            const name = order[oid]["name"];
            result += "<tr>";
            result += '<th scope="row">' + name + "</th>";
            for(let s = 1; s <= this.nb_weeks_total; s++) {
                var nb;
                if (s in table) {
                    if (name in table[s])
                        nb = table[s][name];
                    else
                        nb = 0;
                }
                else
                    nb = 0;
                if (!(s in total_per_week))
                    total_per_week[s] = nb;
                else
                    total_per_week[s] += nb;
                result += '<td';
                result += ' class="' + Logs.get_class_range("o", nb, 0, nb_total, 8)+ '"';
                result += '>' + nb + "</td>";
            }
            result += '<td';
            result += ' class="' + Logs.get_class_range("o", order[oid]["nb"], 0, nb_total, 8)+ '"';
            result += '>' + order[oid]["nb"] + "</td>";
            
            result += "</tr>";
            
        }
        
        result += "</tbody>";
        result += "<tfooter>";
        result += "<tr>";
        result += '<th scope="row">Total</th>';
        var sum = 0;
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            nb = total_per_week[s];
            sum += nb;
            result += '<td';
            result += ' class="' + Logs.get_class_range("o", nb, 0, nb_total, 8)+ '"';
            result += '>' + nb + "</td>";
        }
        result += '<td';
        result += ' class="' + Logs.get_class_range("o", sum, 0, nb_total, 8)+ '"';
        result += '>' + sum + "</td>";
        
        result += "</tr>";
        
        
        result += "</tfooter>";
        result += "</table>";
        
        result += '</div>';
        result += '</div>';
        return result;
    }

    build_publication_date(start) {
        this.start = start;
        this.now = new Date;
        let c = new Date(start);
        this.publicationDate = { "S01E00": start };
        var i = 1;
        while(c < this.now) {
            this.publicationDate[Logs.nbToEpisode(i)] = new Date(c);
            i += 1;
            c.setDate(c.getDate() + 7);

        };
    }
    
    build_dl_structure(db, start) {
        this.db = db;
        db.agents.forEach(function(a) {
            a.regex = new RegExp(a.regex, a.ignorecase ? 'i' : undefined);
        });

        this.dl = {};
        this.dl_week = {};
        this.dl_total = {};
        this.max_week = 0;
        this.max_day = 0;
        
        this.agent_name = {};
        this.agent_type = {};
        this.agent_os = {};
        
        this.robots = {};
        this.nbots = 0;

        for(var row in this.data) {
            if ("episode" in this.data[row]) {
                var day = new Date(this.data[row]["timestamp"] * 1000);
                var day_id = Math.ceil((day - start) / 1000 / 60 / 60 / 24);
                var week_id = Math.ceil((day - start) / 1000 / 60 / 60 / 24 / 7);
                
                var str = this.data[row]["user-agent"];
                var agent = db.agents.find(function(a) { return a.regex.test(str); });
                var bot = false;
                if (agent) {
                    if (! agent.bot) {
                        Logs.add_agent(this.agent_name, week_id, agent.name);
                        Logs.add_agent(this.agent_type, week_id, agent.type);
                        Logs.add_agent(this.agent_os, week_id, agent.os);
                    }
                    else {
                        this.nbots += 1;
                        bot = true;
                        Logs.add_agent(this.robots, week_id, this.data[row]["episode"]);
                    }
                    
                } else {
                    Logs.add_agent(this.agent_name, week_id, "unknown");
                    Logs.add_agent(this.agent_type, week_id, "unknown");
                    Logs.add_agent(this.agent_os, week_id, "unknown");
                }

                if (!bot) {
                    if (! (this.data[row]["episode"] in this.dl)) {
                        this.dl[this.data[row]["episode"]] = {};
                        this.dl_week[this.data[row]["episode"]] = {};
                        this.dl_total[this.data[row]["episode"]] = {"total" : 0, "200": 0, "206": 0};;
                    }
                    if (! (day_id in this.dl[this.data[row]["episode"]]))
                        this.dl[this.data[row]["episode"]][day_id] = {"total" : 0, "200": 0, "206": 0};
                    if (! (week_id in this.dl_week[this.data[row]["episode"]]))
                        this.dl_week[this.data[row]["episode"]][week_id] = {"total" : 0, "200": 0, "206": 0};

                    this.dl[this.data[row]["episode"]][day_id]["total"] += 1;
                    this.dl[this.data[row]["episode"]][day_id][this.data[row]["html-code"]] += 1;

                    if (this.max_day < this.dl[this.data[row]["episode"]][day_id]["total"])
                        this.max_day = this.dl[this.data[row]["episode"]][day_id]["total"];

                    
                    this.dl_week[this.data[row]["episode"]][week_id]["total"] += 1;
                    this.dl_week[this.data[row]["episode"]][week_id][this.data[row]["html-code"]] += 1;
                    if (this.max_week < this.dl_week[this.data[row]["episode"]][week_id]["total"])
                        this.max_week = this.dl_week[this.data[row]["episode"]][week_id]["total"];

                    
                    this.dl_total[this.data[row]["episode"]]["total"] += 1;
                    this.dl_total[this.data[row]["episode"]][this.data[row]["html-code"]] += 1;
                }
            }
        }
        
        this.episodes = [];
        for (var e in this.dl_total) {
            this.episodes.push(e);
        }
        this.episodes.sort();
        
        
        const diffTime = Math.abs(this.now - this.start);
        this.nb_weeks_total = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7)); 


        this.max = 0;
        this.min = -1;
        this.moyenne = 0;
        for(let eid in this.episodes) {
            var episode = this.episodes[eid];
            if (this.dl_total[episode]["total"] > this.max)
                this.max = this.dl_total[episode]["total"];
            if (this.min < 0 || this.dl_total[episode]["total"] < this.min)
                this.min = this.dl_total[episode]["total"];
            this.moyenne += this.dl_total[episode]["total"];
        }
        this.moyenne /= this.episodes.length;

    }
    
    generate_ecoutes_totales_code() {
        // build total table
        var table = '<div class="card">';
        table += '<div class="card-body">';
        table += '<h3 class="card-title">Écoutes par épisode (et répartition par modalité d\'accès)</h3>';

        table += '<table class="table layout_fixed table-bordered table-dark">';
        table += '<caption>Écoutes par épisode (code 200 : téléchargement, code 206 : chargement dans le lecteur du site)</caption>';
        table += "<thead>";
        table += "<tr>";
        table += '<th scope="col"> </th>';
        for(let eid in this.episodes) {
            var episode = this.episodes[eid];
            table += '<th scope="col">' + episode + "</th>";
        }
        table += "</tr>";
        table += "</thead>";
        table += "<tbody>";
        const entries = ["total", "200", "206"];
        for(var prop in entries) {
            table += "<tr>";
            if (entries[prop] == "total")
                table += '<th scope="row">' + entries[prop] + "</th>";
            else
                table += '<th scope="row">code ' + entries[prop] + "</th>";
            for(var eid in this.episodes) {
                episode = this.episodes[eid];
                table += '<td';
                table += ' class="' + Logs.get_class_range2("r", this.dl_total[episode][entries[prop]], 0, this.max, 8)+ '"';
                table += '>' + this.dl_total[episode][entries[prop]] + "</td>";
            }
            table += "</tr>";
        }
        table += "</tbody>";
        table += "</table>";
        table += "</div>";
        table += "</div>";
        
        $("#ecoutes_totales_code").html(table);

        

    }
    
    generate_ecoutes_totales() {
        // séparer les écoutes de première semaine des autres
        var table = '<div class="card">';
        table += '<div class="card-body">';
        table += '<h3 class="card-title">Écoutes des épisodes (totale, et suivant la temporalité)</h3>';

        table += '<table class="table layout_fixed table-bordered table-dark">';
        table += '<caption>Écoutes hebdomadaires, réparties en écoutes du podcast de la semaine vs autres épisodes.</caption>';
        table += "<thead>";
        table += "<tr>";
        table += '<th scope="col"> </th>';
        for(eid in this.episodes) {
            var episode = this.episodes[eid];
            table += '<th scope="col">' + episode + "</th>";
        }
        table += "</tr>";
        table += "</thead>";
        table += "<tbody>";
        
        table += "<tr>";
        table += '<th scope="row">total</th>';
        for(eid in this.episodes) {
            var episode = this.episodes[eid];
            table += '<td';
            table += ' class="' + Logs.get_class_range2("r", this.dl_total[episode]["total"], 0, this.max, 8)+ '"';
            table += '>' + this.dl_total[episode]["total"] + "</td>";
        }
        table += "</tr>";
        
        table += "<tr>";
        table += '<th scope="row">Écoute la semaine de diffusion</th>';
        var sum = 0;
        var other = {};
        for(var eid in this.episodes) {
            var episode = this.episodes[eid];
            var s = parseInt(eid) + 1;
            
            var total = 0;
            if ((episode in this.dl_week) && (s in this.dl_week[episode])) {
                nb = this.dl_week[episode][s]["total"];
                sum += nb;
                for(var s2 in this.dl_week[episode])
                    total += this.dl_week[episode][s2]["total"];
            }
            else {
                nb = " - ";
            }
            table += '<td';
            table += ' class="' + Logs.get_class_range("r", nb, 0, this.max, 8)+ '"';
            table += '>' + nb + "</td>";
            
            if (s in this.robots) {
                other[s] = total - nb;
            }
            else {
                other[s] = nb;
            }
            
        }
        
        table  += "</tr>";

        table += "<tr>";
        table += '<th scope="row">Semaines ultérieures</th>';

        for(eid in this.episodes) {
            var episode = this.episodes[eid];
            var s = parseInt(eid) + 1;

            var nb = other[s];
            table += '<td';
            table += ' class="' + Logs.get_class_range("r", nb, 0, this.max, 8)+ '"';
            table += '>' + nb + "</td>";
        }
        
        table += "</tr>";

        
        table += "</tbody>";
        table += "</table>";
        table += "</div>";
        table += "</div>";
        $("#ecoutes_totales").html(table);

    }
    
    static set_color_ramps() {
        Logs.build_color_ramp("b", 0.2, 0.2, 1, 8);
        Logs.build_color_ramp("g", 0.2, 1, 0, 8);
        Logs.build_color_ramp("r", 1.0, 0, 0.2, 8);
        Logs.build_color_ramp("o", 1, 0.4, 0.0, 8);
        Logs.build_color_ramp("j", 1.0, 1.0, 0.2, 8);
        Logs.build_color_ramp("p", 1, 0.0, 1, 8);
    }
        

    set_data(data) {
        this.nb_before = data.length;
        this.data = Logs.filter_data(data);
        this.nb_removed = this.nb_before - this.data.length;
    }
    
    generate_resume() {
        var resume = "<p>Nombre total d'écoutes&nbsp;: " + (this.data.length - this.nbots) + " (et " + this.nbots + " passages de robots, et " + this.nb_removed + " doublons ou connexions depuis adresses retirées)</p>";
        $("#resume").html(resume);

    }
    
    generate_large_table() {
        
        // build large table

        
        var table = '<div class="card">';
        table += '<div class="card-body">';
        table += '<h3 class="card-title">Distribution des écoutes par semaine</h3>';

        table += '<table class="table layout_fixed table-bordered table-dark">';
        table += '<caption>Écoutes hebdomadaires</caption>';
        table += "<thead>";
        table += "<tr>";
        table += '<th scope="col"> </th>';
        for(let s = 0; s != this.nb_weeks_total; s++) {
            table += '<th scope="col">' + (s + 1) + "</th>";
        }
        table += "</tr>";
        
        // total
        var t_w = {};
        var o_w = {};
        var c_w = {};
        var t_max = 0;
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            t_w[s] = 0;
            o_w[s] = 0;
            c_w[s] = 0;
            for (var e in this.dl_week)
                if (s in this.dl_week[e]) {
                    t_w[s] += this.dl_week[e][s]["total"];
                    if (Logs.nbToEpisode(s - 1).toLowerCase() == e)
                        c_w[s] += this.dl_week[e][s]["total"];
                    else
                        o_w[s] += this.dl_week[e][s]["total"];
                    
                }
            if (t_w[s] > t_max)
                t_max = t_w[s];
        }
                    
        table += "<tr>";
        table += '<th scope="row">total</th>';
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            table += '<td';
            table += ' class="' + Logs.get_class_range2("g", t_w[s], 0, t_max, 8)+ '"';
            table += '>' + t_w[s] + "</td>";
        }
        table += "</tr>";
        
        table += "<tr>";
        table += '<th scope="row">anciens</th>';
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            table += '<td';
            table += ' class="' + Logs.get_class_range2("g", o_w[s], 0, t_max, 8)+ '"';
            table += '>' + o_w[s] + "</td>";
        }
        table += "</tr>";
        
        table += "<tr>";
        table += '<th scope="row">dernier</th>';
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            table += '<td';
            table += ' class="' + Logs.get_class_range2("g", c_w[s], 0, t_max, 8)+ '"';
            table += '>' + c_w[s] + "</td>";
        }
        table += "</tr>";

        
        table += "</thead>";
        table += "<tbody>";

        // for each episode
        for(let eid in this.episodes) {
            const episode = this.episodes[eid];
            table += "<tr>";
            table += '<th scope="row">' + episode + "</th>";
            for(let s = 1; s <= this.nb_weeks_total; s++) {
                var nb;
                if (s in this.dl_week[episode])
                    nb = this.dl_week[episode][s]["total"];
                else
                    nb = 0;
                table += '<td';
                table += ' class="' + Logs.get_class_range2("g", nb, 0, t_max, 8)+ '"';
                table += '>' + nb + "</td>";
            }
            table += "</tr>";
            
        }
        
        table += "</tbody>";
        table += "</table>";
        table += "</div>";
        table += "</div>";
        $("#ecoutes_hebdomadaires").html(table);   
        
    }
    
    generate_week_tables() {
        // première semaine
        
        
        var current_week_other_podcasts = Logs.create_details_week(true);
        var current_week_current_podcast = Logs.create_details_week(true);
        var previous_weeks_other_podcasts = Logs.create_details_week();
        var previous_weeks_current_podcast = Logs.create_details_week();
        for(var row in this.data) {
            if ("episode" in this.data[row]) {
                var str = this.data[row]["user-agent"];
                var agent = this.db.agents.find(function(a) { return a.regex.test(str); });
                if (!agent || !agent.bot) {
                            
                    var day = new Date(this.data[row]["timestamp"] * 1000);
                    var day_id = Math.ceil((day - this.start) / 1000 / 60 / 60 / 24);
                    var week_id = Math.ceil((day - this.start) / 1000 / 60 / 60 / 24 / 7);
                    var week_day = (day.getDay() - Config.day);
                    if (week_day < 0) week_day += 7;
                    var hour = day.getHours();
                    var current_week = (week_id == this.nb_weeks_total);
                    var current_podcast = (this.data[row]["episode"] == Logs.nbToEpisode(week_id - 1).toLowerCase());
                    if (current_week) {
                        if (current_podcast) {
                            current_week_current_podcast[week_day][hour] += 1;
                        }
                        else {
                            current_week_other_podcasts[week_day][hour] += 1;
                        }
                    }
                    else {
                        if (current_podcast) {
                            previous_weeks_current_podcast[week_day][hour] += 1 / (this.nb_weeks_total - 1);
                        }
                        else {
                            previous_weeks_other_podcasts[week_day][hour] += 1 / (this.nb_weeks_total - 1);
                        }
                    }
                }
            }
        }
        
        var table = "";

        table += '<div class="row">';
        table += Logs.details_semaines(current_week_current_podcast, "Podcast de cette semaine", "Écoutes du podcast de cette semaine");
        table += Logs.details_semaines(current_week_other_podcasts, "Autres écoutes cette semaine", "Écoutes cette semaine hors podcast de la semaine");
        table += '</div>';
        
        $("#synthese").html(table);

        table = '<div class="row">';
        table += Logs.details_semaines(previous_weeks_current_podcast, "Écoutes des semaines passées du podcast tout juste sorti", "Les semaines précédentes, moyenne des écoutes des podcasts de la semaine");
        table += Logs.details_semaines(previous_weeks_other_podcasts, "Moyenne des écoutes des semaines passées des autres podcasts", "Les semaines précédentes, moyenne des écoutes des podcasts des semaines passées");
        table += '</div>';
        $("#synthese_autres_semaines").html(table);
    
    }
    
    generate_first_week_details() {
        
        var table = "";
        table += '<div class="card">';
        table += '<div class="card-body">';
        table += '<h3 class="card-title">Détails de la première semaine de chaque épisode</h3>';
        table += '<table class="table layout_fixed table-bordered table-dark">';
        table += '<caption>Écoutes quotidiennes la première semaine de diffusion</caption>';
        table += "<thead>";
        table += "<tr>";
        table += '<th scope="col"> </th>';
        var min_first_week = {}
        var max_first_week = {}
        var sum_first_week = {}
        var sum_first_week_per_ep = {}
        const jour = Logs.shift_array_week(["dimanche", "lundi", "mardi", "mercredi", "jeudi ", "vendredi", "samedi"]);
        for(let s = 1; s <= 7; s++) {
            table += '<th scope="col">' + jour[s - 1] + "</th>";
            min_first_week[s] = -1;
            max_first_week[s] = 0;
            sum_first_week [s] = 0;
            var first = 0;
            for(let eid in this.episodes) {
                const episode = this.episodes[eid];
                var nb;
                if (s + first in this.dl[episode])
                    nb = this.dl[episode][s + first]["total"];
                else
                    nb = 0;
                if (eid != 0 && eid != this.episodes.length - 1) {
                    sum_first_week[s] += nb;
                    if (min_first_week[s] < 0 || nb < min_first_week[s]) min_first_week[s] = nb;
                    if (nb > max_first_week[s]) max_first_week[s] = nb;
                    if (eid in sum_first_week_per_ep)
                        sum_first_week_per_ep[eid] += nb;
                    else
                        sum_first_week_per_ep[eid] = nb;
                }
                first += 7;
            }    
        }
        var max_w = 0;
        for (var eid in sum_first_week_per_ep) {
            if (max_w < sum_first_week_per_ep[eid])
                max_w = sum_first_week_per_ep[eid];
        }
        table += '<th scope="col">total</th>';
        table += "</tr>";
        table += "</thead>";
        table += "<tbody>";
        var first = 0;
        
        for(let eid in this.episodes) {
            const episode = this.episodes[eid];
            var nb_week = 0;
            const idweek = parseInt(eid) + 1;
            if (idweek in this.dl_week[episode])
                nb_week = this.dl_week[episode][idweek]["total"];
            if (nb_week != 0) {
                table += "<tr>";
                table += '<th scope="row">' + episode + " (Σ:" +  nb_week + ")</th>";
                var sum = 0;
                for(let j = 1; j <= 7; j++) {
                    var nb;
                    if (j + first in this.dl[episode])
                        nb = this.dl[episode][j + first]["total"];
                    else
                        nb = 0;
                    sum += nb;
                    table += '<td';
                    table += ' class="' + Logs.get_class_range2("b", nb, 10, max_w, 8)+ '"';
                    table += '>' + nb + '<span style="float: right; font-size: 70%">Σ:' + sum + "</span></td>";
                        
                }
                table += '<td';
                table += ' class="' + Logs.get_class_range2("b", sum, 10, max_w, 8)+ '"';
                table += '>' + sum + "</td>";
                table += "</tr>";
            }
            first += 7;
        }
        table += "</tbody>";
        table += "<tfooter>";

        table += '<tr><th scope="row">minimum (sauf premier et dernier)</th>';
        for(let j = 1; j <= 7; j++) {
            table += '<td>' + min_first_week[j] + "</td>";
        }
        table += "</tr>";
        table += '<tr><th scope="row">maximum (sauf premier et dernier)</th>';
        for(let j = 1; j <= 7; j++) {
            table += '<td>' + max_first_week[j] + "</td>";
        }
        table += "</tr>";
        table += '<tr><th scope="row">moyenne (sauf premier et dernier)</th>';
        for(let j = 1; j <= 7; j++) {
            table += '<td>' + Math.ceil(sum_first_week [j] / (this.episodes.length - 1)) + "</td>";
        }
        table += "</tr>";
        table += "<tfooter>";
        
        table += "</table>";
        table += "</div>";
        table += "</div>";
        $("#ecoutes_premiere_semaine").html(table);
        
    }

    generate_episode_list(rss) {

        fetch(rss)
            .then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                    const items = data.querySelectorAll("item");
                    var options = { year: 'numeric', month: 'short', day: 'numeric' };
                    let html = ``;
                    let i = 1;
                    items.forEach(el => {
                        html += `<li><a href="${el.querySelector("link").innerHTML}">${el.querySelector("title").innerHTML}</a> (semaine ${i} ; ${new Date(el.querySelector("pubDate").innerHTML).toLocaleDateString('fr-FR', options)})</li>`;
                        i += 1;
                    });
                    $("#episodes").html(html);
                    });
    }
    
    generate_description_from_user_agents() {
        const description = this.build_description_agents(this.agent_name, "Source") + 
                this.build_description_agents(this.agent_type, "Type") + 
                this.build_description_agents(this.agent_os, "Système d'exploitation");
                
        $("#sources").html(description);
    }
    
    generate_robots_logs() {
                        
        // ajout des robots
        var txt_robots = '<div class="card">';
        txt_robots += '<div class="card-body">';
        txt_robots += '<h3 class="card-title">Robots</h3>';

        txt_robots += '<table class="table table-bordered table-dark">';
        txt_robots += '<caption>Passage des robots pour chaque semaine</caption>';
        txt_robots += "<thead>";
        txt_robots += "<tr>";
        txt_robots += '<th scope="col"> </th>';
        for(let s = 0; s != this.nb_weeks_total; s++) {
            txt_robots += '<th scope="col">' + (s + 1) + "</th>";
        }
        txt_robots += '<th scope="col">total</th>';
        txt_robots += "</tr>";
        txt_robots += "</thead>";
        txt_robots += "<tbody>";
    
        txt_robots += "<tr>";
        txt_robots += '<th scope="row">Tout épisode confondu</th>';
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            if (s in this.robots) {
                nb = this.robots[s]["total"];
            }
            else {
                nb = 0;
            }
            txt_robots += '<td';
            txt_robots += ' class="' + Logs.get_class_range("j", nb, 0, this.nbots, 8)+ '"';
            txt_robots += '>' + nb + "</td>";
        }
        
        txt_robots += '<td';
        txt_robots += ' class="' + Logs.get_class_range("j", this.nbots, 0, this.nbots, 8)+ '"';
        txt_robots += '>' + this.nbots + "</td>";
        txt_robots += "</tr>";

        txt_robots += "<tr>";
        txt_robots += '<th scope="row">Épisode de la semaine</th>';
        var sum = 0;
        var other = {};
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            var episode = "s01e";
            var nb;
            if (s <= 10) episode += "0" + (s - 1); else episode += (s - 1);
            if ((s in this.robots) && (episode in this.robots[s])) {
                nb = this.robots[s][episode];
                sum += nb;
            }
            else {
                nb = " - ";
            }
            txt_robots += '<td';
            txt_robots += ' class="' + Logs.get_class_range("j", nb, 0, this.nbots, 8)+ '"';
            txt_robots += '>' + nb + "</td>";
            
            if (s in this.robots) {
                other[s] = this.robots[s]["total"] - nb;
            }
            else {
                other[s] = nb;
            }
            
        }
        
        txt_robots += '<td';
        txt_robots += ' class="' + Logs.get_class_range("j", sum, 0, this.nbots, 8)+ '"';
        txt_robots += '>' + sum + '</td>';
        txt_robots += "</tr>";

        txt_robots += "<tr>";
        txt_robots += '<th scope="row">Autres épisodes</th>';
        for(let s = 1; s <= this.nb_weeks_total; s++) {
            nb = other[s];
            txt_robots += '<td';
            txt_robots += ' class="' + Logs.get_class_range("j", nb, 0, this.nbots, 8)+ '"';
            txt_robots += '>' + nb + "</td>";
        }
        
        txt_robots += '<td';
        txt_robots += ' class="' + Logs.get_class_range("", this.nbots - sum, 0, this.nbots, 8)+ '"'; txt_robots += '>' + (this.nbots - sum) + '</td>';
        txt_robots += "</tr>";

        
        txt_robots += "</tbody>";
        txt_robots += "</table>";

        txt_robots += "</div>";
        txt_robots += "</div>";

        $("#robots").html(txt_robots);
    }
    
    generate_last_downloads() {
        
        
        var lines = [];
        const nb_hours_list = 24;
        var start_list = new Date(this.now - 1000 * 60 * 60 * nb_hours_list);
        for(let row in this.data) {
            const day = new Date(this.data[row]["timestamp"] * 1000);
            if (day >= start_list) {
                lines.push({"day": day, "user-agent": this.data[row]["user-agent"], "episode": this.data[row]["episode"], "html-code": this.data[row]["html-code"], "ip": this.data[row]["ip"]});
            }
        }
        lines.sort((a, b) => a.day - b.day);
        
        
        var nb_ecoutes_par_ip = {};
        for(let row in this.data) {
            var ip = this.data[row]["ip"];
            if (ip in nb_ecoutes_par_ip)
                nb_ecoutes_par_ip[ip] += 1;
            else
                nb_ecoutes_par_ip[ip] = 1;
        }
        
        var dernieres_ecoutes = "";
        
        dernieres_ecoutes += '<ul class="nav nav-tabs" id="dEcoutes" role="tablist">';
        dernieres_ecoutes += '<li class="nav-item" role="presentation">';
        dernieres_ecoutes += '<button class="nav-link active" id="human-tab" data-bs-toggle="tab" data-bs-target="#human" type="button" role="tab" aria-controls="human" aria-selected="true">Humain·e·s</button>';
        dernieres_ecoutes += '</li>';
        dernieres_ecoutes += '<li class="nav-item" role="presentation">';
        dernieres_ecoutes += '<button class="nav-link" id="human-robots-tab" data-bs-toggle="tab" data-bs-target="#human-robots" type="button" role="tab" aria-controls="human-robots" aria-selected="false">Robots + Humain·e·s</button>';
        dernieres_ecoutes += '</li>';
        dernieres_ecoutes += '</ul>';
        dernieres_ecoutes += '<div class="tab-content" id="dEcoutesContent">';
        

        for(let idTab = 0; idTab != 2; idTab += 1) {
            const robots = idTab == 1;
            
            var nb_list;
            
            if (robots) {
                dernieres_ecoutes += '<div class="tab-pane" id="human-robots" role="tabpanel" aria-labelledby="human-robots-tab">';
                nb_list = lines.length;
            }
            else {
                dernieres_ecoutes += '<div class="tab-pane show active" id="human" role="tabpanel" aria-labelledby="human-tab">';
                nb_list = 0;
                for(let lid in lines) {
                    const str = lines[lid]["user-agent"];
                    const agent = this.db.agents.find(function(a) { return a.regex.test(str); });
                    if (!agent || !agent.bot)
                        nb_list += 1;
                }
            }
            
            dernieres_ecoutes += '<div class="card">';
            dernieres_ecoutes += '<div class="card-body">';
            dernieres_ecoutes += '<h3 class="card-title">' + nb_list + " téléchargements durant les " + nb_hours_list + ' dernières heures</h3>';
            dernieres_ecoutes += '<p>Les téléchargements depuis la dernière mise à jour ne sont pas intégrés.</p>';
            dernieres_ecoutes += '<table class="table table-bordered table-dark">';
            dernieres_ecoutes += '<caption>Dernières connexions</caption>';
            dernieres_ecoutes += "<thead>";
            dernieres_ecoutes += "<tr>";
            dernieres_ecoutes += '<th scope="col">quand</th><th scope="col">épisode</th><th scope="col">code</th><th scope="col">IP</th>';
            if (robots) {
                dernieres_ecoutes += '<th scope="col">bot</th>';
            }
            else {
                dernieres_ecoutes += '<th scope="col">nb écoutes depuis l\'IP</th>';
            }
            dernieres_ecoutes += '<th scope="col">nom</th><th scope="col">type</th><th scope="col">OS</th><th scope="col">user agent</th>';
            dernieres_ecoutes += "</tr>";
            dernieres_ecoutes += "</thead>";
            dernieres_ecoutes += "<tbody>";
            
            for(let lid in lines) {
                const str = lines[lid]["user-agent"];
                const agent = this.db.agents.find(function(a) { return a.regex.test(str); });
                if (!agent || ! agent.bot || robots) {
                    dernieres_ecoutes += "<tr>";
                    const options = { year: 'numeric', month: 'short', day: 'numeric' };
                    dernieres_ecoutes += "<td>" + lines[lid]["day"].toLocaleTimeString('fr-FR', options) + "</td>";
                    dernieres_ecoutes += "<td>" + lines[lid]["episode"] + "</td>";
                    dernieres_ecoutes += "<td>" + lines[lid]["html-code"] + "</td>";
                    dernieres_ecoutes += '<td><a href="https://tools.keycdn.com/geo?host=' + lines[lid]["ip"] + '">' + lines[lid]["ip"] + "</a>";
                    if (Config.known_ips.includes(lines[lid]["ip"])) // adresses connues
                        dernieres_ecoutes += " *";
                    dernieres_ecoutes += "</td>";
                    if (! agent) {
                        if (robots) dernieres_ecoutes += "<td>-</td>";
                        else
                            dernieres_ecoutes += "<td>" + nb_ecoutes_par_ip[lines[lid]["ip"]] + "</td>";
                        dernieres_ecoutes += "<td></td><td></td><td></td>";
                        
                    }
                    else if (agent.bot) {
                        if (robots) {
                            dernieres_ecoutes += "<td>bot</td>";
                            dernieres_ecoutes += "<td></td><td></td><td></td>";
                        }
                    }
                    else {
                        if (robots) 
                            dernieres_ecoutes += "<td>humain</td>";
                        else
                            dernieres_ecoutes += "<td>" + nb_ecoutes_par_ip[lines[lid]["ip"]] + "</td>";
                        dernieres_ecoutes += "<td>" + agent.name + "</td>";
                        dernieres_ecoutes += "<td>" + agent.type + "</td>";
                        dernieres_ecoutes += "<td>" + agent.os + "</td>";
                    }
                    dernieres_ecoutes += "<td>" + lines[lid]["user-agent"] + "</td>";
                    
                    dernieres_ecoutes += "</tr>";
                }
            }
            
            dernieres_ecoutes += "</tbody>";
            dernieres_ecoutes += "</table>";
            dernieres_ecoutes += "</div>";
            dernieres_ecoutes += "</div>";
            dernieres_ecoutes += "</div>";
        }
        
        dernieres_ecoutes += '</div>',

        
        $("#dernieres_ecoutes").html(dernieres_ecoutes);

        
    }
        
    generate_stats() {
        $("#moyenne").html(Math.ceil(this.moyenne));
        $("#max").html(this.max);
        $("#min").html(this.min);
    }
    
    constructor(rss, start) {
        // build publication date
        
        this.build_publication_date(start);
        
        var logs = this;

        d3.dsv(";", "details.csv").then(
            (data) => {
            
            logs.set_data(data);

            // compute number of dl per day, per episode, per htmlcode
            $.getJSON('db/agents.json', function(db) {

                logs.build_dl_structure(db, start);

                logs.generate_episode_list(rss);
                
                logs.generate_stats();
                
                logs.generate_ecoutes_totales_code();
                
                logs.generate_ecoutes_totales();

                logs.generate_resume();

                logs.generate_large_table();
                
                logs.generate_week_tables();
                
                logs.generate_first_week_details();
                
                logs.generate_description_from_user_agents();
                
                logs.generate_robots_logs();
                
                logs.generate_last_downloads();
            });
        });
        
        Logs.set_color_ramps();
    }
    
    
    
    
}

log = new Logs(Config.rss, Config.start);


