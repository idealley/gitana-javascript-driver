(function($) {

    module("nodeSearch1");

    // Test case : Search operations.
    _asyncTest("Search operations", function()
    {
        expect(5);

        var gitana = GitanaTest.authenticateFullOAuth();
        gitana.createRepository().readBranch("master").then(function() {

            // NOTE: this = branch

            // define 8 slightly different documents
            var obj1 = { "title": "The quick brown fox jumped over the fence" };
            var obj2 = { "title": "The slow brown fox jumped over the fence" };
            var obj3 = { "title": "The quick pink fox jumped over the fence" };
            var obj4 = { "title": "The slow pink fox jumped over the fence" };
            var obj5 = { "title": "The quick brown fox jumped under the house" };
            var obj6 = { "title": "The quick red zebra jumped over the house" };
            var obj7 = { "title": "The slow red zebra jumped over the house" };
            var obj8 = { "title": "The quick brown zebra jumped over the house" };

            var node1 = null;
            var node2 = null;
            var node3 = null;
            var node4 = null;
            var node5 = null;
            var node6 = null;
            var node7 = null;
            var node8 = null;

            // create the 8 nodes
            this.createNode(obj1).then(function() {
                node1 = this;
            });
            this.createNode(obj2).then(function() {
                node2 = this;
            });
            this.createNode(obj3).then(function() {
                node3 = this;
            });
            this.createNode(obj4).then(function() {
                node4 = this;
            });
            this.createNode(obj5).then(function() {
                node5 = this;
            });
            this.createNode(obj6).then(function() {
                node6 = this;
            });
            this.createNode(obj7).then(function() {
                node7 = this;
            });
            this.createNode(obj8).then(function() {
                node8 = this;
            });

            this.then(function() {

                // wait a few seconds to let any async indexing finish
                this.wait(7000);

                // search #1 - find all nodes with the term: "fox"
                this.searchNodes("fox").count(function(count) {
                    equal(count, 5, "Searched for keyword fox and found 5 nodes.");
                });

                // search #2 - find all nodes with the term: "slow"
                this.searchNodes("slow").count(function(count) {
                    equal(count, 3, "Searched for keyword slow and found 3 nodes.");
                });

                // search #3 - find all nodes with the term: "jumped"
                this.searchNodes("jumped").count(function(count) {
                    equal(count, 8, "Searched for keyword jumped and found 3 nodes.");
                });
            });

            this.then(function() {
                // associate all of these nodes
                //
                //   1 -> 2 (a:child with "tags" = "dizzy slash axl rose")
                //   1 -> 3 (a:child with "tags" = "kurt cobain david grohl")   + zebra
                //   1 -> 4 (a:child with "tags" = "eddie van halen")           + fox
                //   3 -> 5 (a:child with "tags" = "eric claptop joe satriani")
                //   3 -> 6 (a:child with "tags" = "rivers cuomo under")           + under
                //   6 -> 7 (a:child with "tags" = "david gilmour roger waters")   + zebra
                //   7 -> 8 (a:child with "tags" = "robert plant jimmy page")

                var a1 = { "_type": "a:child", "tags": "dizzy slash axl rose" };
                var a2 = { "_type": "a:child", "tags": "kurt cobain david grohl zebra" };
                var a3 = { "_type": "a:child", "tags": "eddie van halen fox" };
                var a4 = { "_type": "a:child", "tags": "eric clapton joe satriani" };
                var a5 = { "_type": "a:child", "tags": "rivers cuomo under" };
                var a6 = { "_type": "a:child", "tags": "david gilmour roger waters zebra" };
                var a7 = { "_type": "a:child", "tags": "robert plant jimmy page" };
                this.subchain(node1)
                    .associate(node2, a1)
                    .associate(node3, a2)
                    .associate(node4, a3);
                this.subchain(node3)
                    .associate(node5, a4)
                    .associate(node6, a5);
                this.subchain(node6).associate(node7, a6);
                this.subchain(node7).associate(node8, a7);
            });

            this.then(function() {

                // wait a few seconds to let any async indexing finish
                this.wait(10000);

                this.searchNodes("slash").count(function(count) {
                    equal(count, 1, "Searched for keyword slash and found 1 node.");
                });

                this.searchNodes("fox").count(function(count) {
                    equal(count, 6 , "Searched for keyword fox and found 6 nodes.");
                });
            });

            this.then(function() {
                success();
            });

        });

        var success = function() {
            start();
        };

    });

}(jQuery) );
