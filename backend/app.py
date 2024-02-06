import warnings
warnings.filterwarnings('ignore')

# Librairies
from flask import Flask, request, json
from backend import compute_emissions_custom, compute_emissions_all, bchart_1, bchart_2
from flask_cors import CORS, cross_origin #comment this on deployment
import pandas as pd

print(pd.__version__)

# Application
app = Flask(__name__, static_url_path='', static_folder='frontend/build')
CORS(app) #comment this on deployment
# app.config["DEBUG"] = True
app.config["APPLICATION_ROOT"] = "/"

@app.route('/', methods=["GET", "POST"])
def main():
    if request.method == "POST":

        if request.form['mode'] == '1' : # My trip vs direct trips
            df = pd.DataFrame.from_dict(json.loads(request.form['my-trip']))

            data_mytrip, geo_mytrip = compute_emissions_custom(df)

            data_direct, geo_direct = compute_emissions_all(df)

            response = {'gdf' : pd.concat([geo_mytrip, geo_direct])[['colors', 'geometry']].explode().to_json(),
                        'my_trip' : data_mytrip.to_json(orient='records'), 'direct_trip': data_direct.to_json(orient='records')}

        if request.form['mode'] == '2' : # My trip vs custom trip
            df = pd.DataFrame.from_dict(json.loads(request.form['my-trip']))
            df2 = pd.DataFrame.from_dict(json.loads(request.form['alternative-trip']))

            data_mytrip, geo_mytrip = compute_emissions_custom(df)

            data_alternative, geo_alternative = compute_emissions_custom(df2, cmap = 'RdPu')

            response = {'gdf' : pd.concat([geo_mytrip, geo_alternative])[['colors', 'geometry']].explode().to_json(),
                        'my_trip' : data_mytrip.to_json(orient='records'), 'alternative_trip': data_alternative.to_json(orient='records')}

        return response

    return { 'message': 'ok'}

if __name__ == '__main__':
    app.run(host="localhost", port=8000, debug=False)
