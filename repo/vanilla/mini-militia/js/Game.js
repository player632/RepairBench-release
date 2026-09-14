/**
 * Created by Asim on 4/6/2017.
 */
// ---- repair-bench instrumentation: live-instance capture slot. Written ONLY by
// Game's own constructor below, read ONLY by the verification facade at the foot
// of this file; no application code path assigns it and no handle may assign it.
var rbMmLiveGame = null;

function Game(canvas, resources) {

    var _this;
    this._init = function() {
        
        _this = this;
        rbMmLiveGame = _this;
        this.resources = resources;
        this.canvas = canvas;
        this.ctx = this.canvas.getContext('2d');
        this.messageBox = document.getElementById('messageBox');
        this.ground = new TileGround(this.ctx);
        this.collisionHandler = new CollisionHandler(this.ctx, this.camera, this.ground.mapArray);
        this.gameBullets = [];
        this.shyame = new Shyame(this.ctx, { x: 600, y: 200 }, this.canvas, this.camera, this.collisionHandler, this.resources);
        this.camera = new Camera(this.ctx, this.shyame);
        this.robotUnits = {};

        this.introAudio = this.resources.getAudio('intro');
        this.introAudio.play();

        var randomNoOfRobotUnits = 6;
        this.robotUnitsGenerateInterval = setInterval(
            function() {
                if(Object.size(_this.robotUnits) < randomNoOfRobotUnits)
                    _this.generateRobotUnit();
            }, 3000
        );

        this.addControls();

        this.gameAnimationFrame = requestAnimationFrame(this.drawGame);
    };

    this.showEnemyDirection = function () {

        var offsetY = 100;
        var directionCount = 0;
        for(var i = 0; i < Object.size(_this.robotUnits); i++){

            // console.log(Object.size(_this.gameBullets));
            // console.log(Object.size(_this.shyame.actor.gameBullets));
            // console.log(Object.size(_this.robotUnits[i].gameBullets));

            var distX = _this.robotUnits[i].position.x - _this.shyame.actor.position.x;
            var distY = _this.robotUnits[i].position.y - _this.shyame.actor.position.y;
            var cOffset = 200;
            var distance = Util.calculateDistance(_this.robotUnits[i].position.x, _this.robotUnits[i].position.y, _this.shyame.actor.position.x,  _this.shyame.actor.position.y);
            if(distance < 600 || directionCount == 2) {
                directionCount = 0;
                break;
            }
            var vectorX = distX / distance;
            var vectorY = distY / distance;

            var tBaseX = _this.shyame.actor.position.x + vectorX * cOffset;
            var tBaseY = _this.shyame.actor.position.y + vectorY * cOffset;
            var tDistance = Util.calculateDistance(_this.robotUnits[i].position.x, _this.robotUnits[i].position.y, tBaseX,  tBaseY);

            var tDistX = _this.robotUnits[i].position.x - tBaseX;
            var tDistY = _this.robotUnits[i].position.y - tBaseY;
            var tVectorX = tDistX / tDistance;
            var tVectorY = tDistY / tDistance;
            var tOffset = 20;

            var xPerp = tOffset * tVectorX;
            var yPerp = tOffset * tVectorY;

            var cx = tBaseX - yPerp;
            var cy = tBaseY + xPerp;
            var dx = tBaseX + yPerp;
            var dy = tBaseY - xPerp;

            _this.ctx.beginPath();
            _this.ctx.lineWidth = 3;

            _this.ctx.moveTo(tBaseX + tVectorX * tOffset, tBaseY + tVectorY * tOffset);
            _this.ctx.lineTo(cx, cy);
            _this.ctx.lineTo(dx, dy);
            _this.ctx.lineTo(tBaseX + tVectorX * tOffset, tBaseY + tVectorY * tOffset);

            _this.ctx.strokeStyle = '#ff0000';
            _this.ctx.stroke();
            _this.ctx.strokeStyle = '#fff';
            _this.ctx.closePath();
            _this.ctx.beginPath();
            // _this.ctx.arc(_this.shyame.actor.position.x, _this.shyame.actor.position.y, cOffset, 0, Math.PI * 2);
            _this.ctx.stroke();
            _this.ctx.closePath();
            directionCount++;
        }
    };

    this.generateRobotUnit = function () {

        var rx = Util.getRandomInt(0, _this.canvas.width/3);
        var ry = Util.getRandomInt(-_this.canvas.height, 0);
        var robotUnit = new RobotUnit(Object.size(_this.robotUnits), _this.ctx, {x: rx, y: ry}, _this.shyame, _this.robotUnits, _this.ground.mapArray, _this.collisionHandler, _this, _this.resources);
        _this.robotUnits[Object.size(_this.robotUnits)] = robotUnit;
    };

    this.drawRobotUnits = function () {

        for(var i = 0; i < Object.size(_this.robotUnits); i++) {
            _this.robotUnits[i].move();
            _this.robotUnits[i].drawWeapon();
            _this.robotUnits[i].drawHealthOverHead();
        }
    };

    this.drawGame = function() {

        _this.gameAnimationFrame = requestAnimationFrame(_this.drawGame);
        _this.ctx.clearRect(0, 0, _this.ctx.canvas.width, _this.ctx.canvas.height);
        _this.ground.drawGround();
        _this.camera.move();
        _this.showEnemyDirection();
        _this.shyame.actor.move();
        _this.shyame.actor.drawWeapon();
        _this.shyame.actor._drawShyameStatus();
        _this.drawFire();
        _this.checkShot();
    };

    this.drawFire = function () {

        var refreshedGameBullets = {};
        var count = 0;
        if(Object.size(_this.gameBullets) > 0){
            // console.log(_this.gameBullets);
        }
        for(var i in _this.gameBullets){

            if(_this.gameBullets[i].toPosition.x > _this.ctx.canvas.width
                || _this.gameBullets[i].toPosition.y > _this.ctx.canvas.height
                || _this.gameBullets[i].toPosition.x < 0
                || _this.gameBullets[i].toPosition.y < 0
                || _this.collisionHandler.objectIsOutBound(_this.gameBullets[i].toPosition)){

                _this.gameBullets[i] = null;
            }else if(!_this.gameBullets[i].hit){
                refreshedGameBullets[count] = _this.gameBullets[i];
                _this.gameBullets[i].fire();
                count += 1;
            }
        }

        _this.gameBullets = refreshedGameBullets;
    };

    this.checkShot = function () {

        if(_this.shyame.actor.health == 0){

            if(_this.shyame.actor.noOfLifes > 1) {
                _this.respawn();
            }else{
                _this.gameOver();
            }
        }
        var refreshedBullets = {};
        var refreshedBulletsCount = 0;
        for(var i = 0; i < Object.size(_this.gameBullets); i++){
            if(_this.gameBullets[i].actorType == 'shyame') {
                var refreshedRobotUnitsCount = 0;
                var refreshedRobotUnits = {};
                for (var j = 0; j < Object.size(_this.robotUnits); j++) {
                    if (_this.rectCircleColliding(_this.gameBullets[i], _this.robotUnits[j])) {

                        _this.gameBullets[i].hit = true;
                        _this.robotUnits[j].hitCount += 1;
                        if(_this.robotUnits[j].hitCount == _this.robotUnits[j].maxRobotHit) {
                            _this.shyame.actor.score += 100;
                            _this.shyame.actor.kills += 1;
                            _this.robotUnits[j].death();
                            // delete _this.robotUnits[j];
                        }else{
                            refreshedRobotUnits[refreshedRobotUnitsCount] = _this.robotUnits[j];
                            refreshedRobotUnitsCount += 1;
                        }
                        for (j = j + 1; j < Object.size(_this.robotUnits); j++) {

                            refreshedRobotUnits[refreshedRobotUnitsCount] = _this.robotUnits[j];
                            refreshedRobotUnitsCount += 1;
                        }
                        break;
                    } else {
                        refreshedRobotUnits[refreshedRobotUnitsCount] = _this.robotUnits[j];
                        refreshedRobotUnitsCount += 1;
                    }
                }
                _this.robotUnits = refreshedRobotUnits;
            }else if(_this.gameBullets[i].actorType == 'robot-unit'){

                if (_this.rectCircleColliding(_this.gameBullets[i], _this.shyame.actor)) {

                    if (_this.shyame.actor.health >= 50){

                        _this.shyame.actor.health -= 50;
                    }else if(_this.shyame.actor.health > 0) {

                        _this.shyame.actor.health = 0;
                    }

                    _this.gameBullets[i].hit = true;
                }
            }
            if (!refreshedBullets.hasOwnProperty(i) && !_this.gameBullets[i].hit) {
                refreshedBullets[refreshedBulletsCount] = _this.gameBullets[i];
                refreshedBulletsCount += 1;
            }
        }
        _this.gameBullets = refreshedBullets;
    };

    // returns true if the actor and bullet are colliding
    this.rectCircleColliding = function(bullet, actor) {
        var distX = Math.abs(bullet.toPosition.x - actor.position.x - actor.actorWidth / 2);
        var distY = Math.abs(bullet.toPosition.y - actor.position.y - actor.actorHeight / 2);

        if (distX > (actor.actorWidth / 2 + 5)) {
            return false;
        }
        if (distY > (actor.actorHeight / 2 + 5)) {
            return false;
        }
        if (distX <= (actor.actorWidth / 2)) {
            return true;
        }
        if (distY <= (actor.actorHeight / 2)) {
            return true;
        }

        var dx = distX - actor.actorWidth / 2;
        var dy = distY - actor.actorHeight / 2;
        return (dx * dx + dy * dy <= 25);
    };

    this.respawn = function () {

        _this.respawnTime = 6;
        _this.pauseGame();
        _this.messageBox.style.opacity = 1;
        document.getElementById('score').innerHTML = _this.shyame.actor.score;
        document.getElementById('kills').innerHTML = _this.shyame.actor.kills;
        document.getElementById('respawn-value').innerHTML = _this.respawnTime;

        _this.respawnInterval = setInterval(function () {

            if(_this.respawnTime == 0){

                _this.resumeGame();
                _this.shyame.actor.noOfLifes -= 1;
                _this.shyame.actor.health = _this.shyame.actor.maxHealth;
                clearInterval(_this.respawnInterval);
            }else {
                _this.respawnTime -= 1;
                document.getElementById('respawn-value').innerHTML = _this.respawnTime;
            }
        }, 1000);

        _this.shyame.actor.position = {x: 1400, y: 10};
    };

    this.pauseGame = function () {

        cancelAnimationFrame(_this.gameAnimationFrame);
    };

    this.resumeGame = function () {

        _this.messageBox.style.opacity = 0;
        _this.gameAnimationFrame = requestAnimationFrame(_this.drawGame);
    };

    this.gameOver = function () {

        _this.messageBox.style.opacity = 1;
        document.getElementById('messageHeading').innerHTML = 'GAME OVER';
        document.getElementById('score').innerHTML = _this.shyame.actor.score;
        document.getElementById('kills').innerHTML = _this.shyame.actor.kills;
        document.getElementById('respawn').innerHTML = '';
        document.getElementById('retryButton').style.display = 'block';

        _this.pauseGame();
        _this.removeControls();
        _this.messageBox.style.opacity = 1;
        // _this._init();
    };

    this.addMovements = function(e) {

        _this.shyame.actor.commands['G'] = false;
        _this.shyame.actor.commands['O'] = false;
        switch (e.which) {

            case 87:
                _this.shyame.actor.commands['W'] = true;
                break;
            case 83:
                _this.shyame.actor.commands['D'] = true;
                break;
            case 68:
                _this.shyame.actor.commands['S'] = true;
                break;
            case 65:
                _this.shyame.actor.commands['A'] = true;
                break;
        }
    };

    this.removeMovements = function(e) {

        switch (e.which) {

            case 87:
                _this.shyame.actor.commands['W'] = false;
                break;
            case 83:
                _this.shyame.actor.commands['S'] = false;
                break;
            case 68:
                _this.shyame.actor.commands['D'] = false;
                break;
            case 65:
                _this.shyame.actor.commands['A'] = false;
                break;
        }
    };

    this.updateFaceSideEvent = function(e) {

        _this.shyame.actor.mousePos = _this.getMousePos(_this.canvas, e);
        _this.shyame.actor._updateFaceSide();
    };

    this.fireBulletEvent = function(e){

        _this.resources.getAudio('gun_shot').currentTime = 0;
        _this.gameBullets[Object.size(_this.gameBullets)] = _this.shyame.actor.weapon.fireBullet(_this.shyame.actor.position, _this.getMousePos(_this.canvas, e));
        _this.resources.getAudio('gun_shot').play();
    };

    this.addControls = function() {

        document.addEventListener('keydown', _this.addMovements);
        document.addEventListener('keyup', _this.removeMovements);
        document.addEventListener('mousemove', _this.updateFaceSideEvent);
        document.addEventListener('click', _this.fireBulletEvent);
    };

    this.removeControls = function () {

        document.removeEventListener('keydown', _this.addMovements);
        document.removeEventListener('keyup', _this.removeMovements);
        document.removeEventListener('mousemove', _this.updateFaceSideEvent);
        document.removeEventListener('click', _this.fireBulletEvent);
    };

    this.getMousePos = function(canvas, evt) {
        var rect = canvas.getBoundingClientRect();
        return {
            x: evt.clientX - rect.left,
            y: evt.clientY - rect.top
        };
    }

    this._init();
}
// ---- repair-bench instrumentation: read-only verification facade ----
// Every handle below is a pure read of the document, of a computed style, of the
// two storage objects, of the performance resource timeline or of the live game
// model that Game's own constructor captured in rbMmLiveGame above. There is no
// setter, nothing is cached between calls, nothing is written anywhere and no
// member is writable or enumerable, so a repair cannot be rewarded for satisfying
// the facade instead of the application. The only constructing handles are the
// bullet-shape family: they build ONE transient Bullet through the app's own
// Weapon.fireBullet and read its fields - the Bullet constructor only computes
// numbers (Bullet.fire is what draws), it retains nothing and it writes nothing.
(function () {

    var rbStr = function (v) { return (v === null || v === undefined) ? "" : String(v); };
    var rbEl = function (id) { return document.getElementById(id); };
    var rbTrim = function (v) { return rbStr(v).replace(/\s+/g, " ").trim(); };
    var rbNum = function (v, fb) { var n = Number(v); return isFinite(n) ? n : fb; };
    var rbGame = function () { return rbMmLiveGame; };
    var rbRes = function () { var g = rbGame(); return g ? g.resources : null; };
    var rbActor = function () { var g = rbGame(); return (g && g.shyame && g.shyame.actor) ? g.shyame.actor : null; };
    var rbMap = function () { var g = rbGame(); return (g && g.ground) ? g.ground.mapArray : null; };
    var rbCH = function () { var g = rbGame(); return g ? g.collisionHandler : null; };
    var rbCam = function () { var g = rbGame(); return g ? g.camera : null; };
    var rbCanvas = function () { return document.getElementById('canvas'); };
    var rbRobotMap = function () { var g = rbGame(); return g ? g.robotUnits : null; };
    var rbRobots = function () {
        var m = rbRobotMap();
        if (!m) { return []; }
        var out = [], n = 0;
        for (var k in m) { if (Object.prototype.hasOwnProperty.call(m, k)) { n += 1; } }
        for (var i = 0; i < n; i++) { if (m[i]) { out.push(m[i]); } }
        return out;
    };
    var rbRobot0 = function () { var l = rbRobots(); return l.length ? l[0] : null; };
    var rbProbeActor = function (x, y) {
        var a = rbActor();
        return {
            position: { x: rbNum(x, 0), y: rbNum(y, 0) },
            actorWidth: a ? a.actorWidth : 95,
            actorHeight: a ? a.actorHeight : 153
        };
    };
    var rbBullet = function (tx, ty) {
        var a = rbActor();
        if (!a || !a.weapon) { return null; }
        return a.weapon.fireBullet({ x: a.position.x, y: a.position.y }, { x: rbNum(tx, 0), y: rbNum(ty, 0) });
    };
    var rbBulletRight = function () { var a = rbActor(); return a ? rbBullet(a.position.x + 300, a.position.y) : null; };
    var rbBulletLeft = function () { var a = rbActor(); return a ? rbBullet(a.position.x - 400, a.position.y) : null; };
    var rbImgReady = function (img) { return !!(img && img.complete && img.naturalWidth > 0); };
    var rbEntries = function () {
        try { return performance.getEntriesByType('resource') || []; } catch (e) { return []; }
    };
    var rbSameOrigin = function (url) {
        try { return new URL(url, location.href).origin === location.origin; } catch (e) { return false; }
    };

    var rb = {};
    var rbDef = function (name, fallback, fn) {
        rb[name] = function () {
            try {
                var v = fn.apply(null, arguments);
                return (v === undefined) ? fallback : v;
            } catch (e) {
                return fallback;
            }
        };
    };

    // --- document / data-testid probe census ---
    rbDef("probeCount", -1, function () { return document.querySelectorAll('[data-testid]').length; });
    rbDef("hasProbe", false, function (n) { return !!document.querySelector('[data-testid="' + n + '"]'); });
    rbDef("probeIdsSorted", "", function () {
        var out = [];
        var l = document.querySelectorAll('[data-testid]');
        for (var i = 0; i < l.length; i++) { out.push(l[i].getAttribute('data-testid')); }
        return out.sort().join("|");
    });
    rbDef("exists", false, function (id) { return !!rbEl(id); });
    rbDef("txt", "", function (id) { return rbTrim(rbEl(id).textContent); });
    rbDef("attrOf", "", function (id, n) { return rbStr(rbEl(id).getAttribute(n)); });
    rbDef("computedOf", "", function (id, p) { return rbStr(window.getComputedStyle(rbEl(id))[p]); });
    rbDef("inlineStyleOf", "", function (id, p) { return rbStr(rbEl(id).style[p]); });
    rbDef("elCount", -1, function (sel) { return document.querySelectorAll(sel).length; });
    rbDef("tagNameOf", "", function (id) { return rbStr(rbEl(id).tagName).toLowerCase(); });

    // --- canvas + boot gate ---
    rbDef("canvasPresent", false, function () { return !!rbCanvas(); });
    rbDef("canvasAttrWidth", -1, function () { return rbNum(rbCanvas().getAttribute('width'), -1); });
    rbDef("canvasAttrHeight", -1, function () { return rbNum(rbCanvas().getAttribute('height'), -1); });
    rbDef("canvasClientWidth", -1, function () { return rbNum(rbCanvas().clientWidth, -1); });
    rbDef("wrapperClientWidth", -1, function () { return rbNum(document.getElementsByClassName('wrapper')[0].clientWidth, -1); });
    rbDef("wrapperClientHeight", -1, function () { return rbNum(document.getElementsByClassName('wrapper')[0].clientHeight, -1); });
    rbDef("gameReady", false, function () { return !!rbGame(); });
    rbDef("gameMethodPresent", false, function (n) { var g = rbGame(); return !!(g && typeof g[n] === 'function'); });
    rbDef("drawLoopStarted", false, function () { var g = rbGame(); return !!(g && rbNum(g.gameAnimationFrame, 0) > 0); });
    rbDef("preloadImageTotal", -1, function () { return Object.size(rbRes().images); });
    rbDef("imageLoadedCount", -1, function () { return rbNum(rbRes().imageLoadedCount, -1); });
    rbDef("imagesAllLoaded", false, function () { var r = rbRes(); return r.imageLoadedCount === Object.size(r.images); });
    rbDef("audioTotal", -1, function () { return Object.size(rbRes().audios); });
    rbDef("hasResourceImage", false, function (n) { return !!rbRes().getImage(n); });
    rbDef("resourceImageReady", false, function (n) { return rbImgReady(rbRes().getImage(n)); });
    rbDef("resourceRequested", false, function (sub) {
        var e = rbEntries();
        for (var i = 0; i < e.length; i++) { if (String(e[i].name).indexOf(sub) >= 0) { return true; } }
        return false;
    });

    // --- terrain map ---
    rbDef("mapRowCount", -1, function () { return rbMap().length; });
    rbDef("mapRowWidth", -1, function (r) { return rbMap()[rbNum(r, -1)].length; });
    rbDef("mapCellTotal", -1, function () {
        var m = rbMap(), n = 0;
        for (var i = 0; i < m.length; i++) { n += m[i].length; }
        return n;
    });
    rbDef("tileAt", -1, function (r, c) { return rbNum(rbMap()[rbNum(r, -1)][rbNum(c, -1)].tileType, -1); });
    rbDef("tileCountOfType", -1, function (t) {
        var m = rbMap(), n = 0, want = rbNum(t, -999);
        for (var i = 0; i < m.length; i++) { for (var j = 0; j < m[i].length; j++) { if (m[i][j].tileType === want) { n += 1; } } }
        return n;
    });
    rbDef("grassTileCount", -1, function () { return rb.tileCountOfType(1); });
    rbDef("sandTileCount", -1, function () { return rb.tileCountOfType(2); });
    rbDef("verticalSandCount", -1, function () { return rb.tileCountOfType(3); });
    rbDef("verticalSandRightCount", -1, function () { return rb.tileCountOfType(5); });
    rbDef("obstacleTileCount", -1, function () { return rb.tileCountOfType(4); });
    rbDef("airTileCount", -1, function () { return rb.tileCountOfType(0); });
    rbDef("obstacleCellsInRow", -1, function (r) {
        var row = rbMap()[rbNum(r, -1)], n = 0;
        for (var j = 0; j < row.length; j++) { if (row[j].tileType === 4) { n += 1; } }
        return n;
    });
    rbDef("obstacleFirstColInRow", -1, function (r) {
        var row = rbMap()[rbNum(r, -1)];
        for (var j = 0; j < row.length; j++) { if (row[j].tileType === 4) { return j; } }
        return -1;
    });
    rbDef("obstacleLastColInRow", -1, function (r) {
        var row = rbMap()[rbNum(r, -1)];
        for (var j = row.length - 1; j >= 0; j--) { if (row[j].tileType === 4) { return j; } }
        return -1;
    });
    rbDef("obstacleRows", -1, function () {
        var m = rbMap(), n = 0;
        for (var i = 0; i < m.length; i++) { for (var j = 0; j < m[i].length; j++) { if (m[i][j].tileType === 4) { n += 1; break; } } }
        return n;
    });

    // --- collision predicates (the app's own handler, the app's own live map) ---
    rbDef("groundProbeAt", false, function (x, y) { return rbCH().hasReachedGround(rbProbeActor(x, y)) === true; });
    rbDef("wallProbeAt", false, function (x, y, d) { return rbCH().pushingAgainstWall(rbProbeActor(x, y), rbStr(d)) === true; });
    rbDef("outBoundAt", false, function (x, y) { return rbCH().objectIsOutBound({ x: rbNum(x, 0), y: rbNum(y, 0) }) === true; });
    rbDef("liveActorGroundContact", false, function () { return rbCH().hasReachedGround(rbActor()) === true; });
    rbDef("liveActorWallD", false, function () { return rbCH().pushingAgainstWall(rbActor(), 'D') === true; });
    rbDef("liveActorWallA", false, function () { return rbCH().pushingAgainstWall(rbActor(), 'A') === true; });
    rbDef("hitProbe", false, function (bx, by, ax, ay) {
        var g = rbGame();
        return g.rectCircleColliding(
            { toPosition: { x: rbNum(bx, 0), y: rbNum(by, 0) } },
            { position: { x: rbNum(ax, 0), y: rbNum(ay, 0) }, actorWidth: 95, actorHeight: 153 }
        ) === true;
    });

    // --- player actor ---
    rbDef("actorPresent", false, function () { return !!rbActor(); });
    rbDef("actorX", -99999, function () { return rbNum(rbActor().position.x, -99999); });
    rbDef("actorY", -99999, function () { return rbNum(rbActor().position.y, -99999); });
    rbDef("actorXAbove", false, function (v) { return rbActor().position.x > rbNum(v, 0); });
    rbDef("actorXBelow", false, function (v) { return rbActor().position.x < rbNum(v, 0); });
    rbDef("actorYAbove", false, function (v) { return rbActor().position.y > rbNum(v, 0); });
    rbDef("actorYBelow", false, function (v) { return rbActor().position.y < rbNum(v, 0); });
    rbDef("actorHasFallenFromSpawn", false, function () { return rbActor().position.y > 240 && rbActor().position.y < 300; });
    rbDef("actorOnGround", false, function () { return rb.liveActorGroundContact(); });
    rbDef("actorWidth", -1, function () { return rbNum(rbActor().actorWidth, -1); });
    rbDef("actorHeight", -1, function () { return rbNum(rbActor().actorHeight, -1); });
    rbDef("actorSpriteWidth", -1, function () { return rbNum(rbActor().spriteWidth, -1); });
    rbDef("actorSpriteHeight", -1, function () { return rbNum(rbActor().spriteHeight, -1); });
    rbDef("actorNoOfFrames", -1, function () { return rbNum(rbActor().noOfFrames, -1); });
    rbDef("actorTicksPerFrame", -1, function () { return rbNum(rbActor().ticksPerFrame, -1); });
    rbDef("actorSpeed", -1, function () { return rbNum(rbActor().speed, -1); });
    rbDef("actorGravity", -1, function () { return rbNum(rbActor().gravity, -1); });
    rbDef("actorMaxHealth", -1, function () { return rbNum(rbActor().maxHealth, -1); });
    rbDef("actorMaxJetFuel", -1, function () { return rbNum(rbActor().maxJetFuel, -1); });
    rbDef("actorNoOfLifes", -1, function () { return rbNum(rbActor().noOfLifes, -1); });
    rbDef("actorJetFuel", -1, function () { return rbNum(rbActor().jetFuel, -1); });
    rbDef("actorJetFuelBelow", false, function (v) { return rbActor().jetFuel < rbNum(v, 0); });
    rbDef("actorJetFuelBelowMax", false, function () { return rbActor().jetFuel < rbActor().maxJetFuel; });
    rbDef("actorJetFuelAtMax", false, function () { return rbActor().jetFuel === rbActor().maxJetFuel; });
    rbDef("actorJetPackUsable", false, function () { return rbActor().jetPackUsable === true; });
    rbDef("actorDynamicUp", -99999, function () { return rbNum(rbActor().dynamicUp, -99999); });
    rbDef("actorFaceSide", "", function () { return rbStr(rbActor().faceSide); });
    rbDef("actorCommand", false, function (k) { return rbActor().commands[rbStr(k)] === true; });
    rbDef("actorCommandKeyCount", -1, function () { return Object.keys(rbActor().commands).length; });
    rbDef("actorFrameIndexInRange", false, function () {
        var a = rbActor();
        return a.frameIndex >= 0 && a.frameIndex < a.noOfFrames;
    });
    rbDef("actorMousePosX", -99999, function () { return rbNum(rbActor().mousePos.x, -99999); });
    rbDef("actorMousePosY", -99999, function () { return rbNum(rbActor().mousePos.y, -99999); });
    rbDef("mousePosMatchesClientX", false, function (cx) {
        var r = rbCanvas().getBoundingClientRect();
        return Math.abs(rbActor().mousePos.x - (rbNum(cx, 0) - r.left)) < 0.5;
    });
    rbDef("mousePosMatchesClientY", false, function (cy) {
        var r = rbCanvas().getBoundingClientRect();
        return Math.abs(rbActor().mousePos.y - (rbNum(cy, 0) - r.top)) < 0.5;
    });
    rbDef("actorMousePosIsLeftOfActor", false, function () { return rbActor().mousePos.x < rbActor().position.x; });
    rbDef("actorMousePosIsRightOfActor", false, function () { return rbActor().mousePos.x >= rbActor().position.x; });
    rbDef("canvasMarginBottomStyle", "", function () { return rbStr(rbCanvas().style.marginBottom); });
    rbDef("canvasMarginBottomIsUnset", false, function () { return rbStr(rbCanvas().style.marginBottom) === ""; });
    rbDef("canvasMarginLeftStyle", "", function () { return rbStr(rbCanvas().style.marginLeft); });
    rbDef("canvasMarginLeftStyleIsNonNegative", false, function () {
        var v = parseFloat(rbStr(rbCanvas().style.marginLeft));
        return isNaN(v) ? true : v >= 0;
    });

    // --- camera ---
    rbDef("cameraPresent", false, function () { return !!rbCam(); });
    rbDef("cameraMarginLeft", -99999, function () { return rbNum(rbCam().canvasMarginLeft, -99999); });
    rbDef("cameraMarginLeftIsZero", false, function () { return rbCam().canvasMarginLeft === 0; });
    rbDef("cameraMarginLeftIsNegative", false, function () { return rbCam().canvasMarginLeft < 0; });
    rbDef("cameraSpeed", -1, function () { return rbNum(rbCam().cameraSpeed, -1); });
    rbDef("cameraSpeedMatchesActorSpeed", false, function () { return rbCam().cameraSpeed === rbActor().speed; });
    rbDef("cameraLinkedToActor", false, function () { return rbCam().shyame === rbGame().shyame; });

    // --- weapon skins ---
    rbDef("weaponOffsetX", -1, function () { return rbNum(rbActor().weapon.offset.x, -1); });
    rbDef("weaponOffsetY", -1, function () { return rbNum(rbActor().weapon.offset.y, -1); });
    rbDef("shyameWeaponActorType", "", function () { return rbStr(rbActor().weapon.actorType); });
    rbDef("shyameWeaponImageReady", false, function () { return rbImgReady(rbActor().weapon.weaponImageRight); });
    rbDef("shyameWeaponLeftImageReady", false, function () { return rbImgReady(rbActor().weapon.weaponImageLeft); });
    rbDef("shyameWeaponSkinsDistinct", false, function () {
        var w = rbActor().weapon;
        return !!w.weaponImageRight && w.weaponImageRight !== w.weaponImageLeft;
    });
    rbDef("shyameWeaponIsPlayerSkin", false, function () {
        return rbActor().weapon.weaponImageRight === rbRes().getImage('hand_with_gun');
    });
    rbDef("shyameWeaponLeftIsPlayerSkin", false, function () {
        return rbActor().weapon.weaponImageLeft === rbRes().getImage('hand_with_gun_left');
    });
    rbDef("robotWeaponActorType", "", function () { return rbStr(rbRobot0().weapon.actorType); });
    rbDef("robotWeaponImageReady", false, function () { return rbImgReady(rbRobot0().weapon.weaponImageRight); });
    rbDef("robotWeaponIsEnemySkin", false, function () {
        return rbRobot0().weapon.weaponImageRight === rbRes().getImage('enemy_gun');
    });
    rbDef("robotWeaponLeftIsEnemySkin", false, function () {
        return rbRobot0().weapon.weaponImageLeft === rbRes().getImage('enemy_gun_left');
    });

    // --- bullet shape (transient Bullet through the app's own Weapon.fireBullet) ---
    rbDef("bulletSpeed", -1, function () { return rbNum(rbBulletRight().speed, -1); });
    rbDef("bulletColorShyame", "", function () { return rbStr(rbBulletRight().bulletColor); });
    rbDef("bulletColorRobot", "", function () {
        var r = rbRobot0();
        var b = r.weapon.fireBullet({ x: r.position.x, y: r.position.y }, { x: r.position.x + 300, y: r.position.y });
        return rbStr(b.bulletColor);
    });
    rbDef("bulletActorTypeShyame", "", function () { return rbStr(rbBulletRight().actorType); });
    rbDef("bulletGunOffsetX", -1, function () { return rbNum(rbBulletRight().gunOffset.x, -1); });
    rbDef("bulletGunOffsetY", -1, function () { return rbNum(rbBulletRight().gunOffset.y, -1); });
    rbDef("bulletFromOffsetApplied", false, function () {
        var a = rbActor(), b = rbBulletRight();
        return b.fromPosition.x === a.position.x + a.weapon.offset.x && b.fromPosition.y === a.position.y + a.weapon.offset.y;
    });
    rbDef("bulletHitFlagInitiallyFalse", false, function () { return rbBulletRight().hit === false; });
    rbDef("bulletEndPositionStored", false, function () {
        var a = rbActor(), b = rbBulletRight();
        return b.endPosition.x === a.position.x + 300 && b.endPosition.y === a.position.y;
    });
    rbDef("bulletVectorSignToRight", 0, function () { return Math.sign(rbBulletRight().vector.x); });
    rbDef("bulletVectorSignToLeft", 0, function () { return Math.sign(rbBulletLeft().vector.x); });
    rbDef("bulletVectorMagnitudeIsUnit", false, function () {
        var v = rbBulletRight().vector;
        return Math.abs(Math.sqrt(v.x * v.x + v.y * v.y) - 1) < 0.000000001;
    });
    rbDef("bulletVectorToLeftMagnitudeIsUnit", false, function () {
        var v = rbBulletLeft().vector;
        return Math.abs(Math.sqrt(v.x * v.x + v.y * v.y) - 1) < 0.000000001;
    });
    rbDef("bulletCount", -1, function () { return Object.keys(rbGame().gameBullets).length; });
    rbDef("shyameBulletCount", -1, function () {
        var g = rbGame(), n = 0;
        for (var k in g.gameBullets) {
            if (Object.prototype.hasOwnProperty.call(g.gameBullets, k) && g.gameBullets[k] && g.gameBullets[k].actorType === 'shyame') { n += 1; }
        }
        return n;
    });
    rbDef("gameBulletsIsObject", false, function () {
        var g = rbGame();
        return !!g.gameBullets && typeof g.gameBullets === 'object';
    });

    // --- robot units ---
    rbDef("robotCount", -1, function () { return Object.keys(rbRobotMap()).length; });
    rbDef("robotCountAtLeast", false, function (n) { return Object.keys(rbRobotMap()).length >= rbNum(n, 0); });
    rbDef("robotCountAtMost", false, function (n) { return Object.keys(rbRobotMap()).length <= rbNum(n, 0); });
    rbDef("robotIdsSequential", false, function () {
        var m = rbRobotMap(), n = Object.keys(m).length;
        for (var i = 0; i < n; i++) { if (!m[i]) { return false; } }
        return true;
    });
    rbDef("robotsAllDistinct", false, function () {
        var l = rbRobots(), seen = [];
        for (var i = 0; i < l.length; i++) { if (seen.indexOf(l[i]) >= 0) { return false; } seen.push(l[i]); }
        return l.length > 0;
    });
    rbDef("robotsAllArmed", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) { if (!l[i].weapon || l[i].weapon.actorType !== 'robot-unit') { return false; } }
        return true;
    });
    rbDef("robotsAllHaveAiTimer", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) { if (!(rbNum(l[i].aiInterval, 0) > 0)) { return false; } }
        return true;
    });
    rbDef("robotsAllHaveStepFilter", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) {
            var r = l[i];
            if (typeof r.move !== 'function' || typeof r.step !== 'function' || typeof r._stepFilter !== 'function' || typeof r._stop !== 'function') { return false; }
        }
        return true;
    });
    rbDef("robotGravity", -1, function () { return rbNum(rbRobot0().gravity, -1); });
    rbDef("robotBounceDistance", -1, function () { return rbNum(rbRobot0().bounceDistance, -1); });
    rbDef("robotSpriteWidth", -1, function () { return rbNum(rbRobot0().spriteWidth, -1); });
    rbDef("robotSpriteHeight", -1, function () { return rbNum(rbRobot0().spriteHeight, -1); });
    rbDef("robotActorHeight", -1, function () { return rbNum(rbRobot0().actorHeight, -1); });
    rbDef("robotActorWidth", -1, function () { return rbNum(rbRobot0().actorWidth, -1); });
    rbDef("robotNoOfFrames", -1, function () { return rbNum(rbRobot0().noOfFrames, -1); });
    rbDef("robotMaxSafeDistance", -1, function () { return rbNum(rbRobot0().maxSafeDistance, -1); });
    rbDef("robotMinSafeDistance", -1, function () { return rbNum(rbRobot0().minSafeDistance, -1); });
    rbDef("robotMaxHitInBand", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) { if (!(l[i].maxRobotHit >= 2 && l[i].maxRobotHit <= 5)) { return false; } }
        return true;
    });
    rbDef("robotSpeedInBand", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) { if (!(l[i].speed >= 0 && l[i].speed <= 2.25)) { return false; } }
        return true;
    });
    rbDef("robotHitCountTotal", -1, function () {
        var l = rbRobots(), n = 0;
        for (var i = 0; i < l.length; i++) { n += rbNum(l[i].hitCount, 0); }
        return n;
    });
    rbDef("robotCommandKeysPresent", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) {
            var c = l[i].commandsCount;
            if (!c || !('A' in c) || !('S' in c) || !('D' in c) || !('W' in c)) { return false; }
        }
        return true;
    });
    rbDef("robotExecutingKeysPresent", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) {
            var e = l[i].executingCommands;
            if (!e || !('A' in e) || !('S' in e) || !('D' in e) || !('F' in e)) { return false; }
        }
        return true;
    });
    rbDef("robotCommandBacklogTotal", -1, function () {
        var l = rbRobots(), n = 0;
        for (var i = 0; i < l.length; i++) {
            var c = l[i].commandsCount;
            for (var k in c) { if (Object.prototype.hasOwnProperty.call(c, k)) { n += rbNum(c[k], 0); } }
        }
        return n;
    });
    rbDef("robotAiStepping", false, function () { return rb.robotCommandBacklogTotal() > 0; });
    rbDef("anyRobotHoldsW", false, function () {
        var l = rbRobots();
        for (var i = 0; i < l.length; i++) { if (l[i].commands['W'] === true) { return true; } }
        return false;
    });
    rbDef("anyRobotHoldsASD", false, function () {
        var l = rbRobots();
        for (var i = 0; i < l.length; i++) {
            var c = l[i].commands;
            if (c['A'] === true || c['S'] === true || c['D'] === true) { return true; }
        }
        return false;
    });
    rbDef("robotsAllReleaseMovementCommands", false, function () {
        var l = rbRobots();
        if (!l.length) { return false; }
        for (var i = 0; i < l.length; i++) {
            var c = l[i].commands;
            if (c['A'] === true || c['S'] === true || c['D'] === true || c['W'] === true) { return false; }
        }
        return true;
    });

    // --- HUD / message box ---
    rbDef("messageHeadingText", "", function () { return rb.txt('messageHeading'); });
    rbDef("messageBoxOpacity", "", function () { return rb.computedOf('messageBox', 'opacity'); });
    rbDef("messageBoxInlineOpacity", "", function () { return rb.inlineStyleOf('messageBox', 'opacity'); });
    rbDef("retryButtonDisplay", "", function () { return rb.computedOf('retryButton', 'display'); });
    rbDef("scoreText", "", function () { return rb.txt('score'); });
    rbDef("killsText", "", function () { return rb.txt('kills'); });
    rbDef("respawnValueText", "", function () { return rb.txt('respawn-value'); });
    rbDef("respawnRowText", "", function () { return rb.txt('respawn'); });
    rbDef("hudCountersEmpty", false, function () {
        return rb.txt('score') === "" && rb.txt('kills') === "" && rb.txt('respawn-value') === "";
    });
    rbDef("respawnNeverStarted", false, function () { return typeof rbGame().respawnTime === 'undefined'; });

    // --- runtime network census (zero off-origin traffic) ---
    rbDef("resourceEntryCount", -1, function () { return rbEntries().length; });
    rbDef("offOriginResourceCount", -1, function () {
        var e = rbEntries(), n = 0;
        for (var i = 0; i < e.length; i++) { if (!rbSameOrigin(e[i].name)) { n += 1; } }
        return n;
    });
    rbDef("allResourcesSameOrigin", false, function () {
        var e = rbEntries();
        if (!e.length) { return false; }
        for (var i = 0; i < e.length; i++) { if (!rbSameOrigin(e[i].name)) { return false; } }
        return true;
    });
    rbDef("domOffOriginRefCount", -1, function () {
        var l = document.querySelectorAll('link[href],script[src],img[src],audio[src],source[src],iframe[src]'), n = 0;
        for (var i = 0; i < l.length; i++) {
            var u = l[i].getAttribute('href') || l[i].getAttribute('src');
            if (u && !rbSameOrigin(u)) { n += 1; }
        }
        return n;
    });
    rbDef("scriptTagCount", -1, function () { return document.querySelectorAll('script[src]').length; });
    rbDef("linkTagCount", -1, function () { return document.querySelectorAll('link[href]').length; });
    rbDef("inlineScriptCount", -1, function () { return document.querySelectorAll('script:not([src])').length; });

    // --- state isolation (§1.8.7) ---
    rbDef("storageWriteCount", -1, function () { return localStorage.length + sessionStorage.length; });
    rbDef("cookieEmpty", false, function () { return document.cookie === ""; });
    rbDef("locationHashEmpty", false, function () { return location.hash === ""; });
    rbDef("locationSearchEmpty", false, function () { return location.search === ""; });
    rbDef("locationPathname", "", function () { return rbStr(location.pathname); });
    rbDef("historyLen", -1, function () { return rbNum(history.length, -1); });
    rbDef("enumerableRbGlobals", -1, function () {
        var n = 0, k = Object.keys(window);
        for (var i = 0; i < k.length; i++) { if (k[i].indexOf('__rb') === 0) { n += 1; } }
        return n;
    });
    rbDef("noTestFlagGlobals", false, function () {
        var k = Object.keys(window);
        for (var i = 0; i < k.length; i++) { if (/(__probe|__test|__fix|__flag|__cheat|__stub)/i.test(k[i])) { return false; } }
        return true;
    });
    rbDef("facadeSealed", false, function () {
        var d = Object.getOwnPropertyDescriptor(window, '__rb_mm');
        return !!d && d.writable === false && d.enumerable === false && d.configurable === false;
    });
    rbDef("facadeHandleCount", -1, function () { return Object.getOwnPropertyNames(window.__rb_mm).length; });
    rbDef("facadeAllMembersReadOnly", false, function () {
        var f = window.__rb_mm, ks = Object.getOwnPropertyNames(f);
        if (!ks.length) { return false; }
        for (var i = 0; i < ks.length; i++) {
            var d = Object.getOwnPropertyDescriptor(f, ks[i]);
            if (!d || d.writable || d.enumerable || d.configurable || d.get || d.set) { return false; }
        }
        return true;
    });

    var rbFacade = {};
    for (var rbKey in rb) {
        if (Object.prototype.hasOwnProperty.call(rb, rbKey)) {
            Object.defineProperty(rbFacade, rbKey, { value: rb[rbKey], writable: false, enumerable: false, configurable: false });
        }
    }
    Object.defineProperty(window, "__rb_mm", { value: rbFacade, writable: false, enumerable: false, configurable: false });
})();
