using DelimitedFiles
using Plots
using LinearAlgebra

function tactics_test_math(filename="exam1500-4.csv")

allInfo = readdlm(filename, ',', String, '\n', skipstart=1)
maxScore = 69 # 52 #62 #69
maxRating = 2400 #2400
minRating = 2000 #2000
minTime = 600 # 10 min

if filename == "exam1500-1.csv"
    maxScore = 52
    maxRating = 2000
    minRating = 1500
elseif filename == "exam1500-2.csv"
    maxScore = 62
    maxRating = 2000
    minRating = 1500
elseif filename == "exam2000-1.csv"
    maxScore = 69
    maxRating = 2400
    minRating = 2000
elseif filename == "exam0-1.csv"
    maxScore = 38
    maxRating = 1000
    minRating = 0
elseif filename == "exam0-2.csv"
    maxScore = 31
    maxRating = 1000
    minRating = 0
elseif filename == "exam1500-4.csv"
    maxScore = 58
    maxRating = 2000
    minRating = 1500
else
    println("UNEXPECTED FILENAME")
    return false
end

ratings = parse.(Float64, allInfo[:,2])
times = parse.(Int64, allInfo[:,4])
scores = parse.(Int64, allInfo[:,5])
cohortsLow = Int64[]
for rating in allInfo[:,2]
    roundedRating = fld(parse(Float64, rating), 100) * 100
    push!(cohortsLow, roundedRating)
end
# for cohorts in allInfo[:,3]
#     if cohorts == "2400+"
#         push!(cohortsLow, 2400)
#     else
#         lowHigh = split(cohorts, "-")
#         push!(cohortsLow, parse(Int64, lowHigh[1]))
#     end
# end

# lowTimes = findall((v) -> v < minTime, times)
# deleteat!(ratings, lowTimes)
# deleteat!(times, lowTimes)
# deleteat!(scores, lowTimes)
# deleteat!(cohortsLow, lowTimes)

negativeRatings = findall((v) -> v == -1.0, ratings)
deleteat!(ratings, negativeRatings)
deleteat!(times, negativeRatings)
deleteat!(scores, negativeRatings)
deleteat!(cohortsLow, negativeRatings)

zeroScores = findall((v) -> v < 0.15 * maxScore, scores)
deleteat!(ratings, zeroScores)
deleteat!(times, zeroScores)
deleteat!(scores, zeroScores)
deleteat!(cohortsLow, zeroScores)

notEnoughUsers = findall((v) -> count(==(v), cohortsLow) < 3, cohortsLow)
println(cohortsLow)
println(notEnoughUsers)
deleteat!(cohortsLow, notEnoughUsers)
deleteat!(ratings, notEnoughUsers)
deleteat!(times, notEnoughUsers)
deleteat!(scores, notEnoughUsers)
println(cohortsLow)

sortedLows = sort(unique(cohortsLow))
cohortScores = Dict(sortedLows .=> zeros(length(sortedLows),1))
cohortNum = Dict(sortedLows .=> zeros(length(sortedLows),1))
for (i,score) in enumerate(scores)
    cohortScores[cohortsLow[i]] += score
    cohortNum[cohortsLow[i]] += 1
end

for low in sortedLows
    cohortScores[low] /= cohortNum[low]
end

relevantCohorts = filter((v) -> (minRating-100 <= v[1] < maxRating+100), cohortScores)
plot(collect(values(cohortScores)), collect(keys(cohortScores)), title="Ratings vs Scores: $filename", xlabel="Scores", ylabel="Ratings", label="cohort avg", seriestype=:scatter)
plot!(collect(values(relevantCohorts)), collect(keys(relevantCohorts)), label="relevant cohort avg", seriestype=:scatter)

#plot!(scores, ratings, title="Ratings vs Scores", label="all", xlabel="scores", ylabel="ratings", seriestype=:scatter)
relevantRatings = findall((v) -> (v >= minRating-100 && v < maxRating+100), ratings)

println("Relevant Cohorts: ", relevantCohorts)
#actualRatings = ratings[relevantRatings]
#actualScores = scores[relevantRatings]
actualRatings = collect(keys(relevantCohorts))
actualScores = collect(values(relevantCohorts))
#plot!(actualScores, actualRatings, label="relevant", seriestype=:scatter)
println(actualRatings)
println(actualScores)

linearRegressionMatrix = [ones(length(actualScores),1) actualScores]
parameters = linearRegressionMatrix\actualRatings
println(parameters)
plot!(0:maxScore, parameters[1].+parameters[2].*(0:maxScore), label="linear of relevant")
plot!(0:maxScore, (minRating-100) .+ (maxRating-minRating+200)/(maxScore) .* (0:maxScore), label="imposed fit")
weightedAverageRatings = (0.5).*((minRating-100) .+ (maxRating-minRating+200)/(maxScore) .* (0:maxScore)) .+ (0.5).*(parameters[1].+parameters[2].*(0:maxScore))
plot!(0:maxScore, weightedAverageRatings, label="weighted avg of above two")

weightedAverageRatings = (0.5).*((minRating-100) .+ (maxRating-minRating+200)/(maxScore) .* (actualScores)) .+ (0.5).*(parameters[1].+parameters[2].*(actualScores))
mean = sum(actualRatings)/length(actualRatings)
numerator = sum((actualRatings .- weightedAverageRatings).^2)
denominator = sum((actualRatings .- mean).^2)
r2Value = 1 - numerator/denominator
println("r2 value = ", r2Value)

#linearRegressionMatrix = [ones(length(scores),1) scores]
#parameters = linearRegressionMatrix\ratings
#println(parameters)
#plot!(0:maxScore, parameters[1].+parameters[2].*(0:maxScore), label="linear of everyone")

#linearRegressionMatrix = [ones(length(scores),1) scores scores.*scores]
#parameters = linearRegressionMatrix\ratings
#println(parameters)
#plot!(0:maxScore, parameters[1].+parameters[2].*(0:maxScore).+parameters[3].*(0:maxScore).^2, label="quadratic fit including everyone")

#histogram(scores, bins=25)
return plot!()

end

tactics_test_math()
