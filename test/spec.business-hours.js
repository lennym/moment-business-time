var moment = require('../lib/business-hours');
var localeData = require('../locale/default');

describe('moment.business-hours', function () {

    var now = '2015-02-26T10:12:34',
        weekend = '2015-02-28T10:13:00';

    var date = 'YYYY-MM-DD',
        time = 'HH:mm:ss.SSS',
        full = date + ' ' + time;

    beforeEach(function () {
        moment.locale('en');
    });

    afterEach(function () {
        moment.locale('en', localeData);
    });


    describe('isWorkingDay', function () {

        it('returns false on weekends by default', function () {
            moment(weekend).isWorkingDay().should.be.false;
        });

        it('returns true on weekdays by default', function () {
            moment(now).isWorkingDay().should.be.true;
        });

    });

    describe('isWorkingTime', function () {

        it('returns false on weekends by default', function () {
            moment(weekend).isWorkingTime().should.be.false;
        });

        it('returns true on weekdays by default', function () {
            moment(now).isWorkingTime().should.be.true;
        });

        it('considers working time inclusive', function(){
            moment.locale('en', {
                workinghours: {
                    0: null,
                    1: ['09:00:00', '17:00:00'],
                    2: ['09:00:00', '17:00:00'],
                    3: ['09:00:00', '17:00:00'],
                    4: ['09:00:00', '17:00:00'],
                    5: ['09:00:00', '17:00:00'],
                    6: null
                }
            });

            moment('2017-06-26T09:00:00.000').isWorkingTime().should.be.true;
            moment('2017-06-26T17:00:00.000').isWorkingTime().should.be.true;
        });

        it('considers multiple opening times per day', function(){
            moment.locale('en', {
                workinghours: {
                    0: null,
                    1: ['09:00:00', '12:00:00', '13:00:00', '17:00:00'],
                    2: ['09:00:00', '17:00:00'],
                    3: ['09:00:00', '17:00:00'],
                    4: ['09:00:00', '17:00:00'],
                    5: ['09:00:00', '17:00:00'],
                    6: null
                }
            });

            moment('2017-06-26T10:00:00.000').isWorkingTime().should.be.true;
            moment('2017-06-26T12:30:00.000').isWorkingTime().should.be.false;
            moment('2017-06-26T16:00:00.000').isWorkingTime().should.be.true;
        });

    });

    describe('nextWorkingDay', function () {

        it('returns the next working day', function () {
            moment(now).nextWorkingDay().format(date).should.equal('2015-02-27');
            moment(weekend).nextWorkingDay().format(date).should.equal('2015-03-02');
        });

    });

    describe('nextWorkingTime', function () {

        it('returns the start of the next working day if not a current working day', function () {
            moment(weekend).nextWorkingTime().format(full).should.equal('2015-03-02 09:00:00.000');
        });

        it('returns the start of the next working day if called after closing time on a working day', function () {
            moment('2015-02-26T17:30:00').nextWorkingTime().format(full).should.equal('2015-02-27 09:00:00.000');
        });

        it('returns the start of the working hours if called before opening time on a working day', function () {
            moment('2015-02-26T07:30:00').nextWorkingTime().format(full).should.equal('2015-02-26 09:00:00.000');
        });

        it('returns the current time and date if called during opening hours', function () {
            moment(now).nextWorkingTime().format(full).should.equal('2015-02-26 10:12:34.000');
        });

    });

    describe('nextTransitionTime', function () {

        it('returns the start of the next working period if not a current working period', function () {
            let res = moment(weekend).nextTransitionTime();
            res.moment.format(full).should.equal('2015-03-02 09:00:00.000');
            res.transition.should.equal('open');
        });

        it('returns the start of the next working day if called after closing time on a working day', function () {
            let res = moment('2015-02-26T17:30:00').nextTransitionTime();
            res.moment.format(full).should.equal('2015-02-27 09:00:00.000');
            res.transition.should.equal('open')
        });

        it('returns the start of the next working period if called before opening time on a working day', function () {
            let res = moment('2015-02-26T08:30:00').nextTransitionTime();
            res.moment.format(full).should.equal('2015-02-26 09:00:00.000');
            res.transition.should.equal('open')
        });

        it('returns the end of the current working period if called during working period', function () {
            let res = moment('2015-02-26T13:30:00').nextTransitionTime();
            res.moment.format(full).should.equal('2015-02-26 17:00:00.000');
            res.transition.should.equal('close');
        });
    });

    describe('lastWorkingTime', function () {

        it('returns the end of the last working day if not a current working day', function () {
            moment(weekend).lastWorkingTime().format(full).should.equal('2015-02-27 17:00:00.000');
        });

        it('returns the end of the current working day if called after closing time on a working day', function () {
            moment('2015-02-26T17:30:00').lastWorkingTime().format(full).should.equal('2015-02-26 17:00:00.000');
        });

        it('returns the end of the previous working day if called before opening time on a working day', function () {
            moment('2015-02-26T07:30:00').lastWorkingTime().format(full).should.equal('2015-02-25 17:00:00.000');
        });

        it('returns the current time and date if called during opening hours', function () {
            moment(now).lastWorkingTime().format(full).should.equal('2015-02-26 10:12:34.000');
        });

    });

    describe('lastTransitionTime', function () {

        it('returns the end of the last working day if not a current working day', function () {
            let res = moment(weekend).lastTransitionTime();
            res.moment.format(full).should.equal('2015-02-27 17:00:00.000');
            res.transition.should.equal('close')
        });

        it('returns the end of the current working day if called after closing time on a working day', function () {
            let res = moment('2015-02-26T17:30:00').lastTransitionTime();
            res.moment.format(full).should.equal('2015-02-26 17:00:00.000');
            res.transition.should.equal('close')
        });

        it('returns the end of the previous working day if called before opening time on a working day', function () {
            let res = moment('2015-02-26T07:30:00').lastTransitionTime();
            res.moment.format(full).should.equal('2015-02-25 17:00:00.000');
            res.transition.should.equal('close')
        });

        it('returns the start of the current working period if called during opening hours', function () {
            let res = moment(now).lastTransitionTime();
            res.moment.format(full).should.equal('2015-02-26 09:00:00.000');
            res.transition.should.equal('open')
        });

    });

    describe('addWorkingTime', function () {

        describe('adding days', function () {

            it('adds working days onto date', function () {
                moment(now).addWorkingTime(2, 'days').format(date).should.equal('2015-03-02');
                moment(now).addWorkingTime(10, 'days').format(date).should.equal('2015-03-12');
                moment(now).addWorkingTime(100, 'days').format(date).should.equal('2015-07-16');
            });

            it('handles singular as well as plural units', function () {
                moment(now).addWorkingTime(1, 'day').format(date).should.equal('2015-02-27');
            });

            it('if called on a non-business day then starts from the first business day', function () {
                moment(weekend).addWorkingTime(1, 'day').format(date).should.equal('2015-03-02');
            });

            it('can add negative days', function(){
                moment(now).addWorkingTime(-1, 'day').format(date).should.equal('2015-02-25');
            });

        });

        describe('adding hours', function () {

            it('adds working hours onto datetime within the same working day', function () {
                moment(now).addWorkingTime(2, 'hours').format(full).should.equal('2015-02-26 12:12:34.000');
            });

            it('handles singular as well as plural units', function () {
                moment(now).addWorkingTime(1, 'hour').format(full).should.equal('2015-02-26 11:12:34.000');
            });

            it('starts from opening time of next working day if called on a non-working day', function () {
                moment(weekend).addWorkingTime(2, 'hours').format(full).should.equal('2015-03-02 11:00:00.000');
            });

            it('handles running overnight', function () {
                moment(now).addWorkingTime(9, 'hours').format(full).should.equal('2015-02-27 11:12:34.000');
            });

            it('handles running over multiple nights', function () {
                moment(now).addWorkingTime(19, 'hours').format(full).should.equal('2015-03-02 13:12:34.000');
                // https://github.com/lennym/moment-business-time/issues/3#issuecomment-199341232
                moment('2016-03-21T15:30:00').addWorkingTime(17, 'hour').format(full).should.equal('2016-03-23 16:30:00.000');
                moment('2016-03-21T15:30:00').addWorkingTime(18, 'hour').format(full).should.equal('2016-03-24 09:30:00.000');
            });

            it('handles running over multiple weeks', function () {
                moment(now).addWorkingTime(108, 'hours').format(full).should.equal('2015-03-17 14:12:34.000');
            });

            it('handles working times with breaks', function() {
                moment.locale('en', {
                    workinghours: {
                        0: null,
                        1: ['09:00:00', '17:00:00'],
                        2: ['09:00:00', '17:00:00'],
                        3: ['09:00:00', '17:00:00'],
                        4: ['09:00:00', '12:00:00', '13:00:00', '18:00:00'],
                        5: ['09:00:00', '12:00:00', '12:30:00', '17:00:00'],
                        6: null
                    }
                });
                moment('2020-01-02T10:00:00').addWorkingTime(4, 'hour').format(full).should.equal('2020-01-02 15:00:00.000');
                moment('2020-01-03T11:00:00').addWorkingTime(2, 'hour').format(full).should.equal('2020-01-03 13:30:00.000');
                moment('2020-01-02T10:00:00').addWorkingTime(16, 'hour').format(full).should.equal('2020-01-06 10:30:00.000');
                moment('2020-01-02T12:30:00').addWorkingTime(2, 'hour').format(full).should.equal('2020-01-02 15:00:00.000');
                moment('2020-01-03T11:30:00').addWorkingTime(1, 'hour').format(full).should.equal('2020-01-03 13:00:00.000');
            });
        });

        describe('adding minutes', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).addWorkingTime(45, 'minutes').format(full).should.equal('2015-02-26 10:57:34.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).addWorkingTime(45, 'minutes').format(full).should.equal('2015-03-02 09:45:00.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T16:59:59.700').addWorkingTime(45, 'minutes').format(full).should.equal('2015-02-27 09:44:59.700');
            });

            it('can support values greater than 60', function () {
                moment(now).addWorkingTime(600, 'minutes').format(full).should.equal('2015-02-27 12:12:34.000');
            });

        });

        describe('adding seconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).addWorkingTime(45, 'seconds').format(full).should.equal('2015-02-26 10:13:19.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).addWorkingTime(45, 'seconds').format(full).should.equal('2015-03-02 09:00:45.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T16:59:59.700').addWorkingTime(45, 'seconds').format(full).should.equal('2015-02-27 09:00:44.700');
            });

            it('can support values greater than 60', function () {
                moment(now).addWorkingTime(600, 'seconds').format(full).should.equal('2015-02-26 10:22:34.000');
            });

            it('doesn\'t break on leap years', function () {
                moment.utc('2020-01-06T13:00:00.000Z').addWorkingTime(1, 'seconds').format(full).should.equal('2020-01-06 13:00:01.000');
            });

        });

        describe('adding milliseconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).addWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-26 10:12:34.555');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).addWorkingTime(555, 'milliseconds').format(full).should.equal('2015-03-02 09:00:00.555');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T16:59:59.700').addWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-27 09:00:00.255');
            });

        });

        describe('adding a combination of units', function () {
            it('can handle combinations of hours, minutes, seconds etc', function () {
                moment(now).addWorkingTime(9, 'hours', 48, 'minutes', 17, 'seconds').format(full).should.equal('2015-02-27 12:00:51.000');
            });
        });

        describe('adding an unknown unit', function () {

            it('should return self', function () {
                moment(now).addWorkingTime(3, 'epochs').format(full).should.equal('2015-02-26 10:12:34.000');
            });

        });

    });

    describe('subtractWorkingTime', function () {

        var now = '2015-02-26T16:12:34',
            weekend = '2015-03-01T16:12:34';

        describe('subtracting days', function () {

            it('takes working days off date', function () {
                moment(now).subtractWorkingTime(2, 'days').format(date).should.equal('2015-02-24');
                moment(now).subtractWorkingTime(10, 'days').format(date).should.equal('2015-02-12');
            });

            it('handles singular as well as plural units', function () {
                moment(now).subtractWorkingTime(1, 'day').format(date).should.equal('2015-02-25');
            });

            it('if called on a non-business day then starts from the first business day', function () {
                moment(weekend).subtractWorkingTime(1, 'day').format(date).should.equal('2015-02-27');
            });

            it('can subtract negative days', function(){
                moment(now).subtractWorkingTime(-2, 'day').format(date).should.equal('2015-03-02');
            });

        });

        describe('subtracting hours', function () {

            it('adds working hours onto datetime within the same working day', function () {
                moment(now).subtractWorkingTime(2, 'hours').format(full).should.equal('2015-02-26 14:12:34.000');
            });

            it('handles singular as well as plural units', function () {
                moment(now).subtractWorkingTime(1, 'hour').format(full).should.equal('2015-02-26 15:12:34.000');
            });

            it('starts from opening time of next working day if called on a non-working day', function () {
                moment(weekend).subtractWorkingTime(2, 'hours').format(full).should.equal('2015-02-27 15:00:00.000');
            });

            it('handles running overnight', function () {
                moment(now).subtractWorkingTime(9, 'hours').format(full).should.equal('2015-02-25 15:12:34.000');
            });

            it('handles running over multiple nights', function () {
                moment(now).subtractWorkingTime(19, 'hours').format(full).should.equal('2015-02-24 13:12:34.000');
            });

            it('handles running over multiple weeks', function () {
                moment(now).subtractWorkingTime(108, 'hours').format(full).should.equal('2015-02-09 12:12:34.000');
            });

            it('handles working times with breaks', function() {
                moment.locale('en', {
                    workinghours: {
                        0: null,
                        1: ['09:00:00', '17:00:00'],
                        2: ['09:00:00', '17:00:00'],
                        3: ['09:00:00', '17:00:00'],
                        4: ['09:00:00', '12:00:00', '13:00:00', '18:00:00'],
                        5: ['09:00:00', '12:00:00', '12:30:00', '17:00:00'],
                        6: null
                    }
                });
                moment('2020-01-02T15:00:00').subtractWorkingTime(4, 'hour').format(full).should.equal('2020-01-02 10:00:00.000');
                moment('2020-01-03T13:30:00').subtractWorkingTime(2, 'hour').format(full).should.equal('2020-01-03 11:00:00.000');
                moment('2020-01-06T10:30:00').subtractWorkingTime(16, 'hour').format(full).should.equal('2020-01-02 10:00:00.000');
                moment('2020-01-02T15:00:00').subtractWorkingTime(2, 'hour').format(full).should.equal('2020-01-02 13:00:00.000');
                moment('2020-01-03T13:00:00').subtractWorkingTime(1, 'hour').format(full).should.equal('2020-01-03 11:30:00.000');
            });
        });

        describe('subtracting minutes', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).subtractWorkingTime(45, 'minutes').format(full).should.equal('2015-02-26 15:27:34.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).subtractWorkingTime(45, 'minutes').format(full).should.equal('2015-02-27 16:15:00.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T09:00:00.700').subtractWorkingTime(45, 'minutes').format(full).should.equal('2015-02-25 16:15:00.700');
            });

        });

        describe('subtracting seconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).subtractWorkingTime(45, 'seconds').format(full).should.equal('2015-02-26 16:11:49.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).subtractWorkingTime(45, 'seconds').format(full).should.equal('2015-02-27 16:59:15.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T09:00:20.000').subtractWorkingTime(45, 'seconds').format(full).should.equal('2015-02-25 16:59:35.000');
            });

        });

        describe('subtracting milliseconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).subtractWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-26 16:12:33.445');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).subtractWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-27 16:59:59.445');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T09:00:00.100').subtractWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-25 16:59:59.545');
            });

        });

        describe('subtracting a combination of units', function () {
            it('can handle combinations of hours, minutes, seconds etc', function () {
                moment(now).subtractWorkingTime(9, 'hours', 48, 'minutes', 17, 'seconds').format(full).should.equal('2015-02-25 14:24:17.000');
            });
        });

        describe('subtracting an unknown unit', function () {

            it('should return self', function () {
                moment(now).subtractWorkingTime(3, 'epochs').format(full).should.equal('2015-02-26 16:12:34.000');
            });

        });

    });

    describe('modified locales', function () {

        it('handles inconsistent opening hours', function () {
            moment.locale('en', {
                workinghours: {
                    0: null,
                    1: ['12:00:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['10:00:00', '17:00:00'],
                    4: ['09:00:00', '17:00:00'],
                    5: ['09:30:00', '17:00:00'],
                    6: null
                }
            });
            var mondayMorning = moment('2015-02-23T10:00:00');
            mondayMorning.isWorkingTime().should.be.false;
            mondayMorning.clone().addWorkingTime(2, 'hours').format(full).should.equal('2015-02-23 14:00:00.000');
            mondayMorning.clone().addWorkingTime(15, 'hours').format(full).should.equal('2015-02-25 12:30:00.000');
        });

        it('handles inconsistent closing hours', function () {
            moment.locale('en', {
                workinghours:  {
                    0: null,
                    1: ['09:30:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['09:30:00', '13:00:00'],
                    4: ['09:30:00', '17:00:00'],
                    5: ['09:30:00', '17:00:00'],
                    6: null
                }
            });
            var wednesdayAfternoon = moment('2015-02-25T16:00:00');
            wednesdayAfternoon.isWorkingTime().should.be.false;
            wednesdayAfternoon.clone().addWorkingTime(2, 'hours').format(full).should.equal('2015-02-26 11:30:00.000');
            wednesdayAfternoon.clone().subtractWorkingTime(8, 'hours').format(full).should.equal('2015-02-24 12:30:00.000');
        });

        it('handles different working days', function () {
            moment.locale('en', {
                workinghours: {
                    0: ['09:30:00', '17:00:00'],
                    1: ['09:30:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['09:30:00', '17:00:00'],
                    4: ['09:30:00', '17:00:00'],
                    5: null,
                    6: null
                }
            });
            var fridayAfternoon = moment('2015-02-27T16:00:00'),
                sundayMorning = moment('2015-03-01T10:00:00');
            fridayAfternoon.isWorkingTime().should.be.false;
            fridayAfternoon.isWorkingDay().should.be.false;
            sundayMorning.isWorkingTime().should.be.true;
            sundayMorning.isWorkingDay().should.be.true;
            sundayMorning.lastWorkingDay().format(date).should.equal('2015-02-26'); //thursday
        });

    });

    describe('workingDiff', function () {

        it('calculates the basic diff if the two times are on the same working day', function () {
            var from = moment('2015-02-27T10:00:00'),
                to = moment('2015-02-27T13:30:00');

            from.workingDiff(to, 'hours').should.equal(-3);
            from.workingDiff(to, 'hours', true).should.equal(-3.5);
            to.workingDiff(from, 'hours', true).should.equal(3.5);
            to.workingDiff(from, 'hours').should.equal(3);

            from.workingDiff(to, 'minutes').should.equal(-210);
            to.workingDiff(from, 'minutes').should.equal(210);
        });

        it('calculates the diff of only the working hours if two times are on different days', function () {
            var from = moment('2015-02-27T10:00:00'),
                to = moment('2015-03-02T13:30:00');

            from.workingDiff(to, 'hours').should.equal(-11);
            to.workingDiff(from, 'hours').should.equal(11);
            from.workingDiff(to, 'hours', true).should.equal(-11.5);
            to.workingDiff(from, 'hours', true).should.equal(11.5);
        });

        it('calculates the diff of working hours while respecting breaks', function() {
            moment.locale('en', {
                workinghours: {
                    0: null,
                    1: ['09:00:00', '17:00:00'],
                    2: ['09:00:00', '17:00:00'],
                    3: ['09:00:00', '17:00:00'],
                    4: ['09:00:00', '12:00:00', '13:00:00', '18:00:00'],
                    5: ['09:00:00', '12:00:00', '12:30:00', '17:00:00'],
                    6: null
                }
            });

            moment('2020-01-02T15:00:00').workingDiff('2020-01-02T10:00:00', 'hour').should.equal(4);
            moment('2020-01-03T13:30:00').workingDiff('2020-01-03T11:00:00', 'hour').should.equal(2);
            moment('2020-01-06T10:00:00').workingDiff('2020-01-02T10:00:00', 'hour').should.equal(15);
            moment('2020-01-06T10:00:00').workingDiff('2020-01-02T10:00:00', 'hour', true).should.equal(15.5);
            moment('2020-01-02T15:00:00').workingDiff('2020-01-02T12:30:00', 'hour').should.equal(2);
            moment('2020-01-03T13:00:00').workingDiff('2020-01-03T11:30:00', 'hour').should.equal(1);
        })

        it('calculates the difference between dates in working days', function () {
            var from = moment('2015-02-27T10:00:00'),
                to = moment('2015-03-20T13:30:00');

            from.workingDiff(to, 'days').should.equal(-15);
            to.workingDiff(from, 'days').should.equal(15);

            moment('2015-02-27T15:00:00').workingDiff(moment('2015-02-27T10:00:00'), 'day').should.equal(0);
            moment('2015-02-27T15:00:00').workingDiff(moment('2015-02-27T10:00:00'), 'day', true).should.equal(0.625);
            moment('2015-02-27T15:00:00').workingDiff(moment('2015-02-26T10:00:00'), 'day').should.equal(1)
            moment('2015-02-27T15:00:00').workingDiff(moment('2015-02-26T10:00:00'), 'day', true).should.equal(1.625);

            moment('2015-02-27T15:00:00').workingDiff(moment('2015-02-21T10:00:00'), 'day', true).should.equal(4.75);
            moment('2015-02-21T10:00:00').workingDiff(moment('2015-02-27T15:00:00'), 'day', true).should.equal(-4.75);

        });

        it('handles units that don\'t really makes sense for business opening times by deferring to moment', function () {
            var from = moment('2015-02-27'),
                to = moment('2015-05-27');

            from.workingDiff(to, 'months').should.equal(-3);
            to.workingDiff(from, 'months').should.equal(3);
        });

        it('handles inconsistent closing hours', function () {
            moment.locale('en', {
                workinghours:  {
                    0: null,
                    1: ['09:30:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['09:30:00', '13:00:00'],
                    4: ['09:30:00', '17:00:00'],
                    5: ['09:30:00', '17:00:00'],
                    6: null
                }
            });
            var from = moment('2015-02-23T10:00:00'),
                to = moment('2015-02-26T14:00:00');

            from.workingDiff(to, 'hours').should.equal(-22);
            from.workingDiff(to, 'hours', true).should.equal(-22.5);
            to.workingDiff(from, 'hours').should.equal(22);
            to.workingDiff(from, 'hours', true).should.equal(22.5);
        });

        it('returns zero for times on the same night over consecutive days', function () {
            moment('2016-10-16T18:00:00+00:00').workingDiff('2016-10-17T06:00:00+00:00', 'hours').should.equal(0);
        });

    });

    describe('holidays', function () {

        beforeEach(function () {
            moment.locale('en');
            moment.locale('en', {
                holidays: [
                    '2015-02-27',
                    '*-12-25'
                ]
            });
        });

        afterEach(function () {
            moment.locale('en', {
                holidays: []
            });
        });

        it('does not count holidays as working days', function () {
            moment('2015-02-27').isWorkingDay().should.be.false;
        });

        it('does not include holidays when adding working time', function () {
            moment('2015-02-26').addWorkingTime(3, 'days').format(date).should.equal('2015-03-04');
            moment.utc('2015-02-26T12:00:00Z').addWorkingTime(8, 'hours').format(full).should.equal('2015-03-02 12:00:00.000');
        });

        it('does not include holidays when adding calculating diffs', function () {
            moment('2015-03-02T12:00:00Z').workingDiff('2015-02-26T12:00:00Z', 'hours').should.equal(8);
        });

        it('supports holidays as wildcards', function () {
            moment('2015-12-25').isWorkingDay().should.be.false;
            moment('2016-12-25').isWorkingDay().should.be.false;
            moment('2017-12-25').isWorkingDay().should.be.false;
            moment('2018-12-25').isWorkingDay().should.be.false;
            moment('2019-12-25').isWorkingDay().should.be.false;
        });

    });

});
