var vumigo = require('vumigo_v02');
var fixtures = require('./fixtures');
var assert = require('assert');
var AppTester = vumigo.AppTester;

describe("UoP TB registration app", function() {
    describe("for ussd use", function() {
        var app;
        var tester;

        beforeEach(function() {
            app = new go.app.GoUOPBMOH();
            tester = new AppTester(app);

            tester
                .setup.char_limit(182)
                .setup.config.app({
                    name: 'ussd-registration-test',
                    country_code: '267',  // botswana
                    channel: '*120*8864*0000#',
                    testing_today: '2016-04-05',
                    services: {
                        identities: {
                            api_token: 'test_token_identities',
                            url: "http://localhost:8001/api/v1/"
                        },
                        registrations: {
                            api_token: 'test_token_registrations',
                            url: "http://localhost:8002/api/v1/"
                        },
                        quizzes: {
                            api_token: 'test_token_quizzes',
                            url: "http://localhost:8003/api/v1/"
                        },
                        questions: {
                            api_token: 'test_token_questions',
                            url: "http://localhost:8004/api/v1/"
                        },
                    },
                })
                .setup(function(api) {
                    fixtures().forEach(api.http.fixtures.add);
                })
                ;
        });

        // REGISTRATION TESTING

        describe("Registration testing", function() {
            it("to state_facility_code", function() {
                return tester
                    .setup.user.addr("0820000222")
                    .inputs(
                        {session_event: "new"}  // dial in
                    )
                    .check.interaction({
                        state: "state_facility_code",
                        reply: "Please enter your facility code"
                    })
                    .check(function(api) {
                        go.utils.check_fixtures_used(api, [1,2]);
                    })
                    .run();
            });
            it("to state_gender", function() {
                return tester
                    .setup.user.addr("0820000222")
                    .inputs(
                        {session_event: "new"}  // dial in
                        , "12345"  // state_facility_code
                    )
                    .check.interaction({
                        state: "state_gender",
                        reply: [
                            "Please enter your gender:",
                            "1. Male",
                            "2. Female"
                        ].join('\n')
                    })
                    .check(function(api) {
                        go.utils.check_fixtures_used(api, [1,2]);
                    })
                    .run();
            });
            it("to state_cadre", function() {
                return tester
                    .setup.user.addr("0820000222")
                    .inputs(
                        {session_event: "new"}  // dial in
                        , "12345"  // state_facility_code
                        , "1"  // state_gender - male
                    )
                    .check.interaction({
                        state: "state_cadre",
                        reply: "Please enter your cadre"
                    })
                    .check(function(api) {
                        go.utils.check_fixtures_used(api, [1,2]);
                    })
                    .run();
            });
            it("to state_department", function() {
                return tester
                    .setup.user.addr("0820000222")
                    .inputs(
                        {session_event: "new"}  // dial in
                        , "12345"  // state_facility_code
                        , "1"  // state_gender - male
                        , "Xpress"  // state_cadre
                    )
                    .check.interaction({
                        state: "state_department",
                        reply: "Please enter your department name"
                    })
                    .check(function(api) {
                        go.utils.check_fixtures_used(api, [1,2]);
                    })
                    .run();
            });
            it("to state_end_registration", function() {
                return tester
                    .setup.user.addr("0820000222")
                    .inputs(
                        {session_event: "new"}  // dial in
                        , "12345"  // state_facility_code
                        , "1"  // state_gender
                        , "Xpress"  // state_cadre
                        , "Back-office"  // state_department
                    )
                    .check.interaction({
                        state: "state_end_registration",
                        reply: "Thank you for registering.  You'll soon be receiving quizzes."
                    })
                    .check(function(api) {
                        go.utils.check_fixtures_used(api, [1,2,3,4,5]);
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

        // QUIZ TESTING

        describe("Quiz testing", function() {
            it("to state_end_quiz", function() {
                var valid_fixture_possibilities = [
                    [0,6,9], [0,6,10], [0,6,11], [0,6,12]
                ];

                return tester
                    .setup.user.addr("0820000111")
                    .inputs(
                        {session_event: "new"}  // dial in
                    )
                    .check.interaction({
                        state: "state_end_quiz",
                        reply: "Thank you for completing your quiz."
                    })
                    .check(function(api) {
                        // check the fixtures corresponding to the random
                        // selection made from possible quiz options
                        for(var i = 0; i < valid_fixture_possibilities.length; i++) {
                            try {
                                go.utils.check_fixtures_used(api, valid_fixture_possibilities[i]);
                                break;  // break if used fixtures match any of the valid_fixture_possibilities
                            }
                            catch(AssertionError) {
                                //console.log(AssertionError.message);
                            }
                        }
                    })
                    .check.reply.ends_session()
                    .run();
            });
            it("to state_end_quiz_status", function() {
                return tester
                    .setup.user.addr("0820000333")
                    .inputs(
                        {session_event: "new"}  // dial in
                    )
                    .check.interaction({
                        state: "state_end_quiz_status",
                        reply: "Currently you've got no untaken quizzes."
                    })
                    .check(function(api) {
                        go.utils.check_fixtures_used(api, [7,8]);
                    })
                    .check.reply.ends_session()
                    .run();
            });
        });

    });

});
