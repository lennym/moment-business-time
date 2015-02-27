var moment = require('moment');

var locale = moment.locale(),
    localeData;

try {
    localeData = require('../locale/' + locale);
} catch(e) {
    if (e.code === 'MODULE_NOT_FOUND') {
        localeData = require('../locale/default');
    } else {
        throw e;
    }
}

moment.locale(locale, {
    workinghours: function () { return localeData.HOURS; },
    holidays: function () { return localeData.HOLIDAYS; }
});

function openingTimes(d) {
    d = d.clone();
    var hours = moment.localeData().workinghours();
    if (!d.isWorkingDay()) {
        return null;
    }
    return hours[d.day()].map(function (time) {
        time = time.split(':');
        var _d = d.clone();
        _d.hours(time[0]);
        _d.minutes(time[1] || 0);
        _d.seconds(time[2] || 0);
        _d.milliseconds(0);
        return _d;
    });
}

function addDays(n, d) {
    while (n) {
        d.add(1, 'day');
        if (d.isWorkingDay()) {
            n--;
        }
    }
    return d;
}

function addUnit(unit) {
    return function (n, d) {
        if (!d.isWorkingTime()) {
            d = d.nextWorkingTime();
        }
        while (n > 0) {
            var then = d.clone().add(n, unit);
            if (then.isWorkingTime()) {
                d = d.add(n, unit);
                n = 0;
            } else {
                var next = then.nextWorkingTime();
                var diff = then.diff(openingTimes(d)[1], unit, true);
                d = next;
                n = diff;
            }
        }
        return d;
    };
}

function copy(from, to) {
    ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond'].forEach(function (unit) {
        to.set(unit, from.get(unit));
    });
    return to;
}

moment.fn.addWorkingTime = function addWorkingTime(num, unit) {
    // a.businessdiff(b)
    // this => a
    // comparator => b
    if (typeof unit !== 'string') {
        throw new Error('moment#addWorkingTime - unit must be defined');
    }
    if (typeof num !== 'number') {
        throw new Error('moment#addWorkingTime - duration must be defined');
    }
    var args = [].slice.call(arguments);
    if (args.length % 2) {
        throw new Error('moment#addWorkingTime requires an even number of arguments');
    }

    while (args.length > 2) {
        this.addWorkingTime.apply(this, args.slice(-2));
        args = args.slice(0, -2);
    }

    unit = moment.normalizeUnits(unit);

    var d = this;

    if (unit === 'day') {
        d = addDays(num, d);
    } else {
        if (unit === 'minute') {
            if (num > 59) {
                throw new Error('Use "hours" to add periods greater than 1 hour');
            }
        } else if (unit === 'second') {
            if (num > 999) {
                throw new Error('Use "minutes" to add periods greater than 1 minute');
            }
        } else if (unit === 'millisecond') {
            if (num > 999) {
                throw new Error('Use "seconds" to add periods greater than 1 second');
            }
        }
        d = addUnit(unit)(num, d);
    }
    return copy(d, this);
};

moment.fn.isBusinessDay = function isBusinessDay() {
    var hours = moment.localeData().workinghours();
    return !!hours[this.day()] && !this.isHoliday();
};
moment.fn.isWorkingDay = moment.fn.isBusinessDay;

moment.fn.isWorkingTime = function isWorkingTime() {
    var openinghours = openingTimes(this);
    if (!openinghours) {
        return false;
    } else {
        return this.isAfter(openinghours[0]) && this.isBefore(openinghours[1]);
    }
};

moment.fn.isHoliday = function isHoliday() {
    return false;
};

moment.fn.nextWorkingDay = function nextWorkingDay() {
    var d = this.clone();
    d = d.add(1, 'day');
    while (!d.isWorkingDay()) {
        d = d.add(1, 'day');
    }
    return d;
};

moment.fn.nextWorkingTime = function nextWorkingTime() {
    if (this.isWorkingDay()) {
        var openinghours = openingTimes(this);
        if (this.isBefore(openinghours[0])) {
            return openinghours[0];
        } else if (this.isAfter(openinghours[1])) {
            return openingTimes(this.nextWorkingDay())[0];
        } else {
            return this.clone();
        }
    } else {
        return openingTimes(this.nextWorkingDay())[0];
    }
};


module.exports = moment;
