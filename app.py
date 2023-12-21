from flask import Flask, redirect, render_template, request, session, g
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from helpers import apology, login_required
import sqlite3, json
import ast

# Configure application
app = Flask(__name__)

# Configure session to use filesystem (instead of signed cookies)
app.config["SESSION_FILE_DIR"] = "./flask_session_cache"
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"

Session(app)


# Add template filter for multiline text
@app.template_filter("ntobr")
def ntobr_fiter(a):
    if type(a) is str:
        a = a.replace("\n", "<br>")
    return a


# Add database handlers
DATABASE = "map.db"


def get_db():
    """Shortcut for get database"""
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db


@app.teardown_appcontext
def close_connection(exception):
    """Shortcut for close database"""
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()


def query_db(query, args=(), one=False):
    """Shortcut for quering database"""
    con = get_db()
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    res = cur.execute(query, args)
    rv = res.fetchall()
    return (rv[0] if rv else None) if one else rv


def insert_db(query, args=()):
    """Shortcut for inserting into database"""
    db = get_db()
    db.cursor().execute(query, args)
    db.commit()


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response

@app.route("/index", methods=["GET", "POST"])
@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    if request.method == "POST":
        coords = request.form.get("geom_wkt")
        coords = ast.literal_eval(coords)

        lat = 0
        lng = 0
        count = 0
        for coord in coords:
            lat += float(coord[0])
            lng += float(coord[1])
            count += 1

        lat = lat / count
        lng = lng / count

        zoom = 17
    else:
        lat = 52
        lng = 19
        zoom = 7

    return render_template("map.html", lat=lat, lng=lng, zoom=zoom)

@app.route("/list")
@login_required
def listParcel():
    """Show list of parcels"""
    rows = query_db("SELECT * FROM parcels WHERE user_id = ?", [session["user_id"]])

    return render_template("list.html", rows=rows)


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""
    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 400)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 400)

        # Query database for username
        rows = query_db(
            "SELECT * FROM users WHERE username = ?", [request.form.get("username")]
        )

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0][2], request.form.get("password")
        ):
            return apology("invalid username and/or password", 400)

        # Remember which user has logged in
        session["user_id"] = rows[0][0]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():
    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            return apology("must provide username", 400)

        # TODO: Check if username is already submitted
        elif query_db(
            "SELECT * FROM users WHERE username = ?",
            [request.form.get("username")],
            one=True,
        ):
            return apology("Chose another username", 400)

        # Ensure password was submitted
        elif not request.form.get("password"):
            return apology("must provide password", 400)

        # Ensure password is here
        elif not request.form.get("confirmation"):
            return apology("must confirm password", 400)

        elif request.form.get("confirmation") != request.form.get("password"):
            return apology("password and confirmation don't match", 400)

        # Ensure password have at least 8 letters
        elif len(request.form.get("password")) < 8:
            return render_template(
                "registerpass.html", info="Password must have at least 8 letters"
            )

        # Ensure password have numbers and letters
        elif (
            request.form.get("password").isalpha()
            or request.form.get("password").isdigit()
        ):
            return render_template(
                "registerpass.html",
                info="Password must have at least one number and one letter and one of special character: !@#$%^&*-=+ ",
            )

        # Hash password
        hash = generate_password_hash(request.form.get("password"))

        # Write password into database
        insert_db(
            "INSERT INTO users (username, hash) VALUES (?,?)",
            (request.form.get("username"), hash),
        )

        # Redirect user to login page
        return render_template(
            "registerpass.html", info="You have succefuly registered"
        )

    # User reached route via get
    else:
        return render_template("register.html")


@app.route("/save", methods=["POST"])
@login_required
def saveParcel():
    data = request.json

    # Check if there is teryt in database.
    db = get_db()
    db.row_factory = sqlite3.Row
    cur = db.cursor()
    res = cur.execute("SELECT * FROM parcels WHERE id = ?", [data["id"]])
    rv = res.fetchall()

    if rv:
        date = data["date"]
        price = data["price"]
        link = data["link"]
        contact = data["contact"]
        comment = data["comment"]

        # Insert into database
        query = f"UPDATE parcels SET date = '{date}',price = '{price}', link = '{link}', contact = '{contact}', comment = '{comment}' WHERE user_id = ? AND id = ?"
        insert_db(query, (session["user_id"], data["id"]))

        return "Parcel updated!"

    # Change list into string. Use eval() to take back
    data["geom_wkt"] = repr(data["geom_wkt"])
    data["user_id"] = session["user_id"]

    # Build query
    args = []
    values = []
    for k, v in data.items():
        values.append(v)
        args.append(k)
    values = tuple(values)

    arguments = str()
    args_count = str()
    for ar in args:
        arguments += f" {ar},"
        args_count += "?,"
    arguments = arguments.removesuffix(",")
    args_count = args_count.removesuffix(",")

    # Insert into database
    query = f"INSERT INTO parcels ({arguments}) VALUES ({args_count})"
    insert_db(query, values)

    return "Success!"


@app.route("/delete", methods=["POST"])
@login_required
def deleteParcel():
    data = request.json

    # Check if there is teryt in database.
    db = get_db()
    db.row_factory = sqlite3.Row
    cur = db.cursor()
    res = cur.execute("SELECT * FROM parcels WHERE id = ?", [data["id"]])
    rv = res.fetchall()
    if not rv:
        return "400"

    # Delete from database
    query = f"DELETE FROM parcels WHERE user_id = ? AND id = ?"
    insert_db(query, (session["user_id"], data["id"]))

    return "200"


@app.route("/parcels", methods=["POST"])
@login_required
def getParcel():
    # Ask database for input
    resp = query_db("SELECT * FROM parcels WHERE user_id = ?", [session["user_id"]])

    data = []
    for res in resp:
        temp = eval(res["geom_wkt"])
        line = dict(res)
        line["geom_wkt"] = temp
        data.append(dict(line))

    return json.dumps(data)
